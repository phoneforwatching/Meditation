<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { enhance } from "$app/forms";
  import { t, locale } from "$lib/i18n";
  import HeatmapCalendar from "$lib/components/HeatmapCalendar.svelte";
  import DailyReminder from "$lib/components/DailyReminder.svelte";
  import type { AchievementStatus } from "$lib/achievements";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: stage = getTreeStage(data.totalMinutes);
  $: nextStage = getTreeStage(stage.maxMinutes + 1);
  // Handle max stage (Infinity)
  $: isMaxStage = stage.maxMinutes === Infinity;
  $: progressPercent = isMaxStage
    ? 100
    : Math.max(
        0,
        Math.min(
          100,
          ((data.totalMinutes - stage.minMinutes) /
            (stage.maxMinutes - stage.minMinutes + 1)) *
            100,
        ),
      );

  $: achievements = (data.achievements || []) as AchievementStatus[];
  $: unlockedCount = achievements.filter((badge) => badge.achieved).length;
  $: nextBadge = achievements.find((badge) => !badge.achieved);
</script>

<div class="max-w-2xl mx-auto space-y-8">
  <!-- Hero Section -->
  <div class="text-center space-y-4 py-8">
    <div class="inline-block p-4 rounded-full bg-sage/10 mb-4">
      <span class="text-6xl">{stage.symbol}</span>
    </div>
    <h1 class="text-4xl font-bold text-sage">{$t(`tree.${stage.id}.name`)}</h1>
    <p class="text-slate/60 max-w-md mx-auto">{$t(`tree.${stage.id}.desc`)}</p>

    {#if !isMaxStage}
      <div
        class="w-full bg-earth/20 rounded-full h-4 mt-4 overflow-hidden relative max-w-md mx-auto"
      >
        <div
          class="bg-sage h-full rounded-full transition-all duration-1000 ease-out"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <p class="text-sm text-slate/60 mt-2">
        {data.totalMinutes} / {stage.maxMinutes + 1}
        {$t("dashboard.untilNext")}
        {$t(`tree.${nextStage.id}.name`)}
      </p>
    {:else}
      <p class="text-sage font-bold mt-4">{$t("dashboard.maxLevel")}</p>
    {/if}

    <div class="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-earth/10">
        <div class="text-2xl font-bold text-sage">{data.streak}</div>
        <div class="text-xs text-slate/50 uppercase tracking-wider">
          {$t("dashboard.streak")}
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-earth/10">
        <div class="text-2xl font-bold text-sage">{data.totalMinutes}</div>
        <div class="text-xs text-slate/50 uppercase tracking-wider">
          {$t("dashboard.totalMinutes")}
        </div>
      </div>
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-earth/10">
        <div class="text-2xl font-bold text-sage">{data.totalSessions}</div>
        <div class="text-xs text-slate/50 uppercase tracking-wider">
          {$t("dashboard.sessions")}
        </div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="grid grid-cols-1 gap-4 max-w-md mx-auto">
    <a
      href="/timer"
      class="bg-sage hover:bg-sage/90 text-white text-lg font-semibold py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center gap-2"
    >
      <span>⏱️</span>
      {$t("dashboard.startTimer")}
    </a>
    <DailyReminder />
  </div>

  <!-- Achievements -->
  <section
    class="bg-gradient-to-br from-sage/5 via-cream to-white border border-earth/10 rounded-3xl shadow-sm p-6 space-y-4"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <p
          class="text-xs uppercase tracking-[0.14em] text-slate/50 font-semibold"
        >
          {$t("badges.title")}
        </p>
        <h2 class="text-2xl font-bold text-slate">
          {$t("badges.subtitle")}
        </h2>
        <p class="text-sm text-slate/60 mt-1">
          {unlockedCount} / {achievements.length} {$t("badges.unlocked")}
          {#if nextBadge}
            · {$t("badges.next")}: {$t(`badges.${nextBadge.id}.name`)}
          {/if}
        </p>
      </div>
      <div
        class="bg-white/80 border border-earth/10 rounded-2xl px-4 py-3 shadow-sm text-sm"
      >
        <div class="font-semibold text-sage flex items-center gap-2">
          <span class="text-lg">{stage.symbol}</span>
          <span>{$t(`tree.${stage.id}.name`)}</span>
        </div>
        <div class="text-slate/60">
          {data.totalMinutes} {$t("dashboard.totalMinutes")}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each achievements as badge}
        {@const remaining = Math.max(0, badge.threshold - badge.current)}
        <div
          class="relative rounded-2xl border border-earth/10 bg-white/80 overflow-hidden shadow-sm"
        >
          <div
            class="absolute inset-0 {badge.achieved ? 'bg-gradient-to-br from-sage/10 via-transparent to-cream/70' : 'bg-earth/5'}"
            aria-hidden="true"
          ></div>
          <div class="relative p-4 flex gap-3">
            <div
              class="h-12 w-12 rounded-xl flex items-center justify-center text-2xl {badge.achieved
                ? 'bg-sage/20 text-sage shadow-inner'
                : 'bg-earth/20 text-slate/60'}"
            >
              {badge.icon}
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-semibold text-slate">
                    {$t(`badges.${badge.id}.name`)}
                  </div>
                  <p class="text-sm text-slate/60">
                    {$t(`badges.${badge.id}.desc`)}
                  </p>
                </div>
                <span
                  class="text-xs font-semibold px-2 py-1 rounded-full {badge.achieved
                    ? 'bg-sage text-white'
                    : 'bg-earth/30 text-slate/60'}"
                >
                  {badge.achieved
                    ? $t("badges.unlocked")
                    : `${Math.round(badge.progress * 100)}%`}
                </span>
              </div>

              <div class="mt-2 h-2 bg-earth/10 rounded-full overflow-hidden">
                <div
                  class="h-full {badge.achieved ? 'bg-sage' : 'bg-earth'} transition-all"
                  style="width: {Math.min(100, Math.round(badge.progress * 100))}%"
                ></div>
              </div>

              <div class="text-xs text-slate/60">
                {#if badge.achieved}
                  {$t("badges.unlocked")}
                {:else}
                  {remaining}
                  {badge.type === "streak"
                    ? $t("badges.days")
                    : badge.type === "time"
                      ? $t("badges.minutes")
                      : $t("badges.sessions")} {$t("badges.toGo")}
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Heatmap Calendar -->
  <div class="max-w-2xl mx-auto">
    <HeatmapCalendar sessions={data.allSessions || []} />
  </div>

  <!-- Recent History -->
  <div class="max-w-md mx-auto">
    <h2 class="text-xl font-bold text-slate mb-4">
      {$t("dashboard.recentHistory")}
    </h2>
    {#if data.recentSessions.length === 0}
      <div class="text-center py-8 text-slate/40 italic">
        {$t("dashboard.noSessions")}
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.recentSessions as session}
          <div
            class="bg-white p-4 rounded-xl shadow-sm border border-earth/10 flex justify-between items-center"
          >
            <div class="flex-1">
              <div class="font-semibold text-slate">{session.sessionType}</div>
              <div class="text-xs text-slate/50">
                {session.completedAt
                  ? new Date(session.completedAt).toLocaleDateString(
                      $locale === "th" ? "th-TH" : "en-US",
                    )
                  : ""}
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
              {#if session.moodRating}
                <span class="text-lg" title="Mood: {session.moodRating}/5">
                  {["", "😫", "😕", "😐", "🙂", "😊"][session.moodRating]}
                </span>
              {/if}
              <span class="font-mono font-bold text-sage text-sm sm:text-base"
                >{session.durationMinutes}m</span
              >
              <form
                action="?/delete"
                method="POST"
                use:enhance
                on:submit={(e) => {
                  if (
                    !confirm(
                      $locale === "th"
                        ? `ต้องการลบเซสชัน ${session.durationMinutes} นาทีนี้หรือไม่?`
                        : `Delete this ${session.durationMinutes} minute session?`,
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={session.id} />
                <button
                  type="submit"
                  class="text-red-400 hover:text-red-600 active:text-red-700 p-1.5 rounded-lg hover:bg-red-50 active:bg-red-100 transition-all touch-manipulation"
                  title={$t("dashboard.delete")}
                >
                  <span class="text-lg">🗑️</span>
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-pulse-slow {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.05);
    }
  }
</style>
