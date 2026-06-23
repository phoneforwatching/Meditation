<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { cubicInOut } from "svelte/easing";
  import { vibrate, HAPTIC_PATTERNS } from "$lib/haptics";
  import { locale, t } from "$lib/i18n";
  import type { PageData } from "./$types";

  export let data: PageData;
  $: session = data.session;
  $: lang = ($locale === "th" ? "th" : "en") as "th" | "en";

  const BREATH_PHASES: Record<string, ["inhale" | "hold" | "exhale", number][]> =
    {
      box: [
        ["inhale", 4],
        ["hold", 4],
        ["exhale", 4],
        ["hold", 4],
      ],
      "478": [
        ["inhale", 4],
        ["hold", 7],
        ["exhale", 8],
      ],
      calm: [
        ["inhale", 4],
        ["exhale", 6],
      ],
    };

  const musicFiles: Record<string, string | null> = {
    none: null,
    relaxing: "/music/relaxing.mp3",
    forest: "/music/forest.mp3",
    rain: "/music/rain.mp3",
    ocean: "/music/ocean.mp3",
  };

  let started = false;
  let paused = false;
  let completed = false;
  let elapsed = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let startTime = 0;

  $: total = session.durationMinutes * 60;
  $: remaining = Math.max(0, total - elapsed);
  $: progress = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

  // Current prompt: the last step whose `at` has been reached.
  $: currentStep = session.steps
    .filter((s) => s.at <= elapsed)
    .slice(-1)[0] ?? session.steps[0];

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // --- Breathing visual ---
  const BREATH_MIN = 0.62;
  const BREATH_MAX = 1;
  const breathScale = tweened(BREATH_MIN, { easing: cubicInOut });
  let breathPhaseId: "inhale" | "hold" | "exhale" | "" = "";
  let breathIdx = 0;
  let breathTimer: ReturnType<typeof setTimeout> | undefined;
  $: breathActive = !!session.breath;

  function runBreath(phases: ["inhale" | "hold" | "exhale", number][]) {
    const [phase, secs] = phases[breathIdx % phases.length];
    breathPhaseId = phase;
    const ms = secs * 1000;
    if (phase === "inhale") breathScale.set(BREATH_MAX, { duration: ms });
    else if (phase === "exhale") breathScale.set(BREATH_MIN, { duration: ms });
    breathTimer = setTimeout(() => {
      breathIdx++;
      runBreath(phases);
    }, ms);
  }
  function startBreath() {
    stopBreath();
    if (!session.breath) return;
    const phases = BREATH_PHASES[session.breath];
    if (!phases) return;
    breathIdx = 0;
    runBreath(phases);
  }
  function stopBreath() {
    if (breathTimer) clearTimeout(breathTimer);
    breathTimer = undefined;
  }

  // --- Audio ---
  let bell: HTMLAudioElement;
  let bgMusic: HTMLAudioElement | null = null;

  onMount(() => {
    bell = new Audio("/bell.mp3");
    bell.load();
  });

  function playMusic() {
    const file = musicFiles[session.music];
    if (!file) return;
    bgMusic = new Audio(file);
    bgMusic.loop = true;
    bgMusic.play().catch((e) => console.log("music play failed", e));
  }
  function stopMusic() {
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
      bgMusic = null;
    }
  }

  function start() {
    vibrate(HAPTIC_PATTERNS.TAP);
    started = true;
    paused = false;
    completed = false;
    startTime = Date.now() - elapsed * 1000;
    playMusic();
    startBreath();
    interval = setInterval(() => {
      elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed >= total) {
        elapsed = total;
        finish();
      }
    }, 200);
  }

  function pause() {
    vibrate(HAPTIC_PATTERNS.TAP);
    paused = true;
    if (interval) clearInterval(interval);
    stopBreath();
    if (bgMusic) bgMusic.pause();
  }

  function resume() {
    start();
  }

  function finish() {
    if (interval) clearInterval(interval);
    stopBreath();
    breathScale.set(BREATH_MIN, { duration: 600 });
    completed = true;
    started = false;
    vibrate(HAPTIC_PATTERNS.TIMER_COMPLETE);
    if (bell) {
      bell.volume = 1;
      bell.play().catch(() => {});
    }
    stopMusic();
  }

  function exit() {
    if (interval) clearInterval(interval);
    stopBreath();
    stopMusic();
  }

  onDestroy(exit);

  $: loggedMinutes = Math.max(1, Math.round(elapsed / 60));
</script>

<div class="max-w-lg mx-auto py-8 text-center space-y-6">
  {#if !started && !completed}
    <!-- Intro -->
    <div class="space-y-6" in:fade={{ duration: 300 }}>
      <div class="space-y-2">
        <div class="text-5xl">{session.emoji}</div>
        <h1 class="text-2xl font-bold text-slate">{session.title[lang]}</h1>
        <p class="text-slate/60 text-sm max-w-xs mx-auto">
          {session.subtitle[lang]}
        </p>
      </div>

      <div
        class="flex items-center justify-center gap-2 text-xs text-slate/60"
      >
        <span class="rounded-full bg-sage/10 px-3 py-1 font-semibold text-sage">
          {session.durationMinutes}
          {$t("timer.minutes")}
        </span>
        {#if session.breath}
          <span class="rounded-full bg-sage/10 px-3 py-1 font-semibold text-sage"
            >🌬️ {session.breath === "478"
              ? "4·7·8"
              : session.breath === "box"
                ? "Box"
                : "4·6"}</span
          >
        {/if}
      </div>

      <button
        on:click={start}
        class="w-full max-w-xs mx-auto py-4 rounded-full bg-sage text-white text-lg font-semibold shadow-lg hover:bg-sage/90 transition-all active:scale-[0.98]"
      >
        <span class="mr-1">🧘</span>
        {$t("guided.begin")}
      </button>
      <div>
        <a
          href="/guided"
          class="text-sm text-slate/50 hover:text-slate/75 transition-colors"
        >
          ← {$t("guided.allSessions")}
        </a>
      </div>
    </div>
  {:else if completed}
    <!-- Complete -->
    <div class="space-y-6" in:scale={{ duration: 400, start: 0.9 }}>
      <div class="text-7xl">✨</div>
      <div class="space-y-1">
        <h1 class="text-2xl font-bold text-sage">
          {$t("guided.completeTitle")}
        </h1>
        <p class="text-slate/60 text-sm">{$t("guided.completeDesc")}</p>
      </div>
      <div class="flex flex-col gap-3 max-w-xs mx-auto">
        <a
          href="/log?duration={loggedMinutes}&type={encodeURIComponent(
            session.type,
          )}"
          class="inline-flex min-h-12 items-center justify-center rounded-xl bg-sage px-4 font-semibold text-white shadow hover:bg-sage/90 transition-colors"
        >
          <span class="mr-2">📝</span>
          {$t("guided.logCta")}
        </a>
        <a
          href="/guided"
          class="text-sm text-slate/50 hover:text-slate/75 transition-colors"
        >
          {$t("guided.allSessions")}
        </a>
      </div>
    </div>
  {:else}
    <!-- Player -->
    <div class="space-y-8" in:fade={{ duration: 300 }}>
      <div class="relative w-72 h-72 mx-auto flex items-center justify-center">
        {#if breathActive}
          <div
            class="absolute inset-0 rounded-full bg-sage/15 blur-2xl"
            style="transform: scale({$breathScale});"
          ></div>
          <div
            class="absolute inset-3 rounded-full border-2 border-sage/30"
            style="transform: scale({$breathScale});"
          ></div>
        {:else}
          <div
            class="absolute inset-0 rounded-full bg-sage/10 blur-2xl animate-pulse"
          ></div>
        {/if}

        <svg class="w-full h-full -rotate-90 relative z-10">
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="currentColor"
            stroke-width="6"
            fill="transparent"
            class="text-sage/15"
          />
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            stroke-dasharray={2 * Math.PI * 130}
            stroke-dashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            stroke-linecap="round"
            class="text-sage transition-all duration-500 ease-linear"
          />
        </svg>

        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-4xl font-mono font-bold text-slate">
            {formatTime(remaining)}
          </div>
          {#if breathActive && breathPhaseId && !paused}
            <div class="mt-2 text-sm font-semibold text-sage">
              🌬️ {$t("timer.breath." + breathPhaseId)}
            </div>
          {/if}
        </div>
      </div>

      <!-- Guidance prompt -->
      <div class="min-h-[3.5rem] px-6">
        {#key currentStep.at}
          <p
            in:fade={{ duration: 600 }}
            class="text-base leading-relaxed text-slate/80"
          >
            {paused ? $t("timer.paused") : currentStep[lang]}
          </p>
        {/key}
      </div>

      <!-- Controls -->
      <div class="flex justify-center gap-4">
        {#if paused}
          <button
            on:click={resume}
            class="w-16 h-16 rounded-full bg-sage text-white text-2xl shadow-lg"
            >▶</button
          >
        {:else}
          <button
            on:click={pause}
            class="w-16 h-16 rounded-full bg-slate/10 text-slate text-2xl"
            >⏸</button
          >
        {/if}
        <a
          href="/guided"
          on:click={exit}
          class="w-16 h-16 rounded-full border-2 border-slate/20 text-slate/60 text-xl flex items-center justify-center hover:border-red-300 hover:text-red-400 transition-colors"
        >
          ✕
        </a>
      </div>
    </div>
  {/if}
</div>
