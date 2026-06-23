<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fly } from "svelte/transition";
  import { t } from "$lib/i18n";

  // Each goal maps to a recommended breathing pattern, ambient sound and
  // session type — these prime the timer via localStorage on completion.
  const goals = [
    {
      id: "calm",
      emoji: "🌊",
      titleKey: "onboarding.goalCalm",
      descKey: "onboarding.goalCalmDesc",
      breath: "478",
      breathLabel: "4·7·8",
      music: "relaxing",
      type: "Breath",
    },
    {
      id: "sleep",
      emoji: "🌙",
      titleKey: "onboarding.goalSleep",
      descKey: "onboarding.goalSleepDesc",
      breath: "calm",
      breathLabel: "4·6",
      music: "ocean",
      type: "Body Scan",
    },
    {
      id: "focus",
      emoji: "🎯",
      titleKey: "onboarding.goalFocus",
      descKey: "onboarding.goalFocusDesc",
      breath: "box",
      breathLabel: "Box 4·4·4·4",
      music: "forest",
      type: "Open Awareness",
    },
  ];

  const minuteOptions = [5, 10, 15, 20];

  let step = 0;
  let selectedGoal = "calm";
  let dailyGoal = 10;
  let saving = false;

  $: goal = goals.find((g) => g.id === selectedGoal) ?? goals[0];

  function chooseGoal(id: string) {
    selectedGoal = id;
    step = 1;
  }

  async function finish() {
    if (saving) return;
    saving = true;

    // Prime the timer with the goal's recommended settings.
    try {
      localStorage.setItem("meditationBreath", goal.breath);
      localStorage.setItem("meditationMusic", goal.music);
      localStorage.setItem("breathe_onboarded", "1");
    } catch {
      // localStorage may be unavailable (private mode) — non-fatal.
    }

    // Persist the daily goal; don't block the flow if it fails.
    try {
      await fetch("/api/settings/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoalMinutes: dailyGoal }),
      });
    } catch (e) {
      console.error("Failed to save daily goal", e);
    }

    goto("/timer");
  }

  function skip() {
    try {
      localStorage.setItem("breathe_onboarded", "1");
    } catch {
      // ignore
    }
    goto("/");
  }

  // If the user already finished onboarding, don't show it again.
  onMount(() => {
    if (localStorage.getItem("breathe_onboarded")) {
      goto("/");
    }
  });
</script>

<div
  class="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-cream via-cream to-sage/10 px-6 py-10 overflow-y-auto"
>
  <!-- Progress dots -->
  <div class="flex items-center justify-center gap-2 mb-2">
    {#each [0, 1, 2] as i}
      <span
        class="h-1.5 rounded-full transition-all duration-300 {i === step
          ? 'w-6 bg-sage'
          : i < step
            ? 'w-1.5 bg-sage'
            : 'w-1.5 bg-sage/25'}"
      ></span>
    {/each}
  </div>

  <div class="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
    {#if step === 0}
      <div in:fly={{ y: 16, duration: 350 }} class="space-y-7 text-center">
        <div class="space-y-2">
          <div class="text-5xl mb-1">🌳</div>
          <h1 class="text-2xl font-bold text-slate">
            {$t("onboarding.welcome")}
          </h1>
          <p class="text-slate/60 text-sm">{$t("onboarding.intro")}</p>
        </div>

        <div class="space-y-2 text-left">
          <h2 class="text-lg font-semibold text-slate text-center mb-4">
            {$t("onboarding.goalQuestion")}
          </h2>
          {#each goals as g}
            <button
              on:click={() => chooseGoal(g.id)}
              class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 bg-white/70 border-earth/15 hover:border-sage hover:bg-sage/5 transition-all text-left active:scale-[0.98]"
            >
              <span class="text-3xl">{g.emoji}</span>
              <span class="flex-1">
                <span class="block font-semibold text-slate"
                  >{$t(g.titleKey)}</span
                >
                <span class="block text-xs text-slate/55">{$t(g.descKey)}</span>
              </span>
              <span class="text-slate/30 text-xl">→</span>
            </button>
          {/each}
        </div>

        <button
          on:click={skip}
          class="text-sm text-slate/45 hover:text-slate/70 transition-colors"
        >
          {$t("onboarding.skip")}
        </button>
      </div>
    {:else if step === 1}
      <div in:fly={{ y: 16, duration: 350 }} class="space-y-8 text-center">
        <div class="space-y-2">
          <div class="text-4xl">{goal.emoji}</div>
          <h2 class="text-xl font-bold text-slate">
            {$t("onboarding.goalMinutesQuestion")}
          </h2>
          <p class="text-slate/55 text-sm">{$t("onboarding.goalMinutesHint")}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          {#each minuteOptions as m}
            <button
              on:click={() => (dailyGoal = m)}
              class="py-6 rounded-2xl border-2 transition-all active:scale-[0.98] {dailyGoal ===
              m
                ? 'border-sage bg-sage/10 shadow-sm scale-[1.02]'
                : 'border-earth/15 bg-white/70 hover:border-sage/50'}"
            >
              <span class="block text-3xl font-bold text-sage">{m}</span>
              <span class="block text-xs text-slate/55 mt-1"
                >{$t("onboarding.perDay")}</span
              >
            </button>
          {/each}
        </div>

        <div class="flex items-center justify-between gap-3 pt-2">
          <button
            on:click={() => (step = 0)}
            class="px-5 py-3 text-slate/60 hover:text-slate transition-colors"
          >
            {$t("onboarding.back")}
          </button>
          <button
            on:click={() => (step = 2)}
            class="flex-1 max-w-[200px] py-3.5 rounded-full bg-sage text-white font-semibold shadow-lg hover:bg-sage/90 transition-all active:scale-[0.98]"
          >
            {$t("onboarding.next")}
          </button>
        </div>
      </div>
    {:else}
      <div in:fly={{ y: 16, duration: 350 }} class="space-y-8 text-center">
        <div class="space-y-2">
          <div class="text-5xl mb-1">✨</div>
          <h2 class="text-2xl font-bold text-slate">
            {$t("onboarding.readyTitle")}
          </h2>
          <p class="text-slate/60 text-sm">{$t("onboarding.readyDesc")}</p>
        </div>

        <div
          class="rounded-2xl border-2 border-sage/20 bg-white/70 p-5 space-y-3 text-left"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-sage/70">
            {$t("onboarding.recommended")}
          </p>
          <div class="flex items-center gap-3">
            <span class="text-2xl">{goal.emoji}</span>
            <span class="font-semibold text-slate">{$t(goal.titleKey)}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-slate/70">
            <span>🌬️ {goal.breathLabel}</span>
            <span class="text-slate/30">·</span>
            <span>🎯 {dailyGoal} {$t("onboarding.perDay")}</span>
          </div>
        </div>

        <div class="space-y-3">
          <button
            on:click={finish}
            disabled={saving}
            class="w-full py-4 rounded-full bg-sage text-white text-lg font-semibold shadow-lg hover:bg-sage/90 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <span class="mr-1">🧘</span>
            {$t("onboarding.start")}
          </button>
          <button
            on:click={() => (step = 1)}
            class="text-sm text-slate/50 hover:text-slate/75 transition-colors"
          >
            {$t("onboarding.back")}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
