<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { vibrate, HAPTIC_PATTERNS } from "$lib/haptics";
  import { t } from "$lib/i18n";

  let durationMinutes = 10;
  let timeLeft = durationMinutes * 60;
  let isRunning = false;
  let isPaused = false;
  let interval: any;
  let completed = false;
  // Audio context will be initialized on first interaction

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  let audio: HTMLAudioElement;
  let bgMusic: HTMLAudioElement;

  onMount(() => {
    audio = new Audio("/bell.mp3");
    audio.load();

    bgMusic = new Audio(
      "/Relaxing music Relieves stress Anxiety and Depression  Heals the Mind body and Soul - Deep Sleep.mp3",
    );
    bgMusic.loop = true;
    bgMusic.load();
  });

  function startTimer() {
    vibrate(HAPTIC_PATTERNS.TAP);

    // iOS Unlock: Play and pause immediately on user interaction
    if (audio) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        })
        .catch((e) => console.log("Audio unlock failed", e));
    }

    if (bgMusic) {
      bgMusic
        .play()
        .catch((e) => console.log("Background music play failed", e));
    }

    if (!isRunning) {
      timeLeft = durationMinutes * 60;
    }
    isRunning = true;
    isPaused = false;
    completed = false;

    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        finishTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    vibrate(HAPTIC_PATTERNS.TAP);
    isPaused = true;
    clearInterval(interval);
    if (bgMusic) {
      bgMusic.pause();
    }
  }

  function resumeTimer() {
    vibrate(HAPTIC_PATTERNS.TAP);
    isPaused = false;
    if (bgMusic) {
      bgMusic
        .play()
        .catch((e) => console.log("Background music resume failed", e));
    }
    interval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        finishTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    vibrate(HAPTIC_PATTERNS.WARNING);
    clearInterval(interval);
    isRunning = false;
    isPaused = false;
    timeLeft = durationMinutes * 60;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  let isShaking = false;

  function triggerShake() {
    isShaking = true;
    setTimeout(() => (isShaking = false), 500);
  }

  function finishTimer() {
    clearInterval(interval);
    completed = true;
    isRunning = false;
    vibrate(HAPTIC_PATTERNS.TIMER_COMPLETE);
    triggerShake();
    playSound();
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  function playSound() {
    if (audio) {
      audio.volume = 1;
      audio.play().catch((e) => console.log("Audio play failed", e));
    }
  }

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  function handleLogClick() {
    // Stop all audio before navigating
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  $: progress =
    isRunning || isPaused
      ? ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100
      : 0;
</script>

<div
  class="max-w-lg mx-auto py-12 text-center space-y-8 {isShaking
    ? 'animate-shake'
    : ''}"
>
  {#if !isRunning && !completed}
    <div class="space-y-6" in:fade>
      <h1 class="text-3xl font-bold text-sage">{$t("timer.ready")}</h1>

      <!-- Preset Timer Buttons -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate"
          >{$t("timer.quickStart")}</label
        >
        <div class="flex flex-wrap gap-2 justify-center">
          {#each [5, 10, 15, 20, 30] as preset}
            <button
              on:click={() => (durationMinutes = preset)}
              class="px-4 py-2 rounded-full border-2 transition-all {durationMinutes ===
              preset
                ? 'border-sage bg-sage text-white'
                : 'border-sage/30 text-sage hover:border-sage/60 hover:bg-sage/5'}"
            >
              {preset}
              {$t("timer.minutes")}
            </button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate"
          >{$t("timer.duration")}</label
        >
        <div class="flex items-center justify-center gap-4">
          <button
            class="p-2 rounded-full hover:bg-earth/10 text-2xl w-10 h-10 flex items-center justify-center text-sage"
            on:click={() =>
              (durationMinutes = Math.max(1, durationMinutes - 1))}>-</button
          >
          <input
            type="number"
            bind:value={durationMinutes}
            min="1"
            max="999"
            class="text-4xl font-mono font-bold text-sage w-24 text-center bg-transparent border-b-2 border-sage/20 focus:border-sage focus:outline-none"
          />
          <button
            class="p-2 rounded-full hover:bg-earth/10 text-2xl w-10 h-10 flex items-center justify-center text-sage"
            on:click={() =>
              (durationMinutes = Math.min(999, durationMinutes + 1))}>+</button
          >
        </div>
      </div>

      <button
        on:click={startTimer}
        class="bg-sage hover:bg-sage/90 text-white text-xl font-semibold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
      >
        {$t("timer.start")}
      </button>
    </div>
  {:else if completed}
    <div class="space-y-6" in:fade>
      <div class="text-6xl mb-4">✨</div>
      <h1 class="text-3xl font-bold text-sage">{$t("timer.complete")}</h1>
      <p class="text-slate/60">{$t("timer.notice")}</p>

      <div class="flex flex-col gap-3 max-w-xs mx-auto">
        <a
          href="/log?duration={durationMinutes}&type=Breath"
          on:click={handleLogClick}
          class="bg-sage hover:bg-sage/90 text-white font-bold py-3 px-6 rounded-xl shadow-md"
        >
          {$t("timer.log")}
        </a>
        <button
          on:click={() => {
            completed = false;
            stopTimer();
          }}
          class="text-slate/60 hover:text-sage"
        >
          {$t("timer.back")}
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-8 relative" in:fade>
      <!-- Timer Circle -->
      <div class="relative w-64 h-64 mx-auto flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            class="text-earth/20"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            stroke-dasharray={2 * Math.PI * 120}
            stroke-dashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            class="text-sage transition-all duration-1000 ease-linear"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center flex-col">
          <div class="text-5xl font-mono font-bold text-slate">
            {formatTime(timeLeft)}
          </div>
          <div class="text-sm text-slate/50 mt-2">
            {isPaused ? $t("timer.paused") : $t("timer.breathing")}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex justify-center gap-4">
        {#if isPaused}
          <button
            on:click={resumeTimer}
            class="bg-sage text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition"
          >
            ▶
          </button>
        {:else}
          <button
            on:click={pauseTimer}
            class="bg-earth/20 text-slate w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:bg-earth/30 transition"
          >
            ⏸
          </button>
        {/if}

        <button
          on:click={stopTimer}
          class="border-2 border-slate/20 text-slate/60 w-16 h-16 rounded-full flex items-center justify-center text-xl hover:border-red-400 hover:text-red-400 transition"
        >
          ✕
        </button>
      </div>

      <div class="text-center">
        <a
          href="/log?duration={Math.ceil(
            (durationMinutes * 60 - timeLeft) / 60,
          )}&type=Breath"
          on:click={handleLogClick}
          class="text-sm text-slate/40 hover:text-sage"
        >
          {$t("timer.finishEarly")}
        </a>
      </div>
    </div>
  {/if}
</div>
