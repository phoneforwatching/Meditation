<script lang="ts">
  import { t, locale } from "$lib/i18n";
  import MoodTrendChart from "$lib/components/MoodTrendChart.svelte";

  export let data;

  const moodEmojis = ["", "\u{1F62B}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"];

  function moodEmoji(val: number): string {
    const rounded = Math.round(val);
    return moodEmojis[Math.min(5, Math.max(1, rounded))] || "\u{1F610}";
  }

  $: moodDelta = data.thisWeekAvgMood - data.lastWeekAvgMood;
  $: moodDeltaLabel =
    moodDelta > 0.1
      ? $t("insights.moodUp")
      : moodDelta < -0.1
        ? $t("insights.moodDown")
        : $t("insights.moodStable");
  $: moodDeltaColor =
    moodDelta > 0.1
      ? "text-sage"
      : moodDelta < -0.1
        ? "text-red-400"
        : "text-slate/50";

  $: topType = data.typeDistribution.length > 0 ? data.typeDistribution[0] : null;

  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      Breath: "\u{1F32C}\uFE0F",
      "Body Scan": "\u{1F9D8}",
      "Loving Kindness": "\u{1F496}",
      "Open Awareness": "\u{1F3AF}",
      Mantra: "\u{1F3B6}",
      Walking: "\u{1F6B6}",
      Other: "\u{2728}",
    };
    return icons[type] || "\u{2728}";
  }

  function weekdayName(dow: number): string {
    const key = $locale === "th" ? "th" : "en";
    return data.weekdayNames[key][dow] || "";
  }

  $: timeBucketLabel = data.insights.bestTimeOfDay
    ? $t(`insights.${data.insights.bestTimeOfDay}`)
    : "";

  const timeBucketIcons: Record<string, string> = {
    morning: "\u{1F305}",
    afternoon: "\u{2600}\uFE0F",
    evening: "\u{1F307}",
    night: "\u{1F31C}",
  };
</script>

<div class="max-w-4xl mx-auto space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate">{$t("insights.title")}</h1>
      <p class="text-sm text-slate/60">{$t("insights.subtitle")}</p>
    </div>
    <a href="/" class="text-sm text-sage hover:underline">{"\u{2190}"} Home</a>
  </div>

  <!-- Period Toggle -->
  <div class="flex gap-2">
    <a
      href="/insights?period=7"
      class="px-4 py-2 rounded-full text-sm font-bold border transition-colors {data.period ===
      7
        ? 'bg-sage text-white border-sage'
        : 'bg-white text-slate border-slate/20 hover:border-sage'}"
    >
      {$t("insights.period7")}
    </a>
    <a
      href="/insights?period=30"
      class="px-4 py-2 rounded-full text-sm font-bold border transition-colors {data.period ===
      30
        ? 'bg-sage text-white border-sage'
        : 'bg-white text-slate border-slate/20 hover:border-sage'}"
    >
      {$t("insights.period30")}
    </a>
  </div>

  <!-- Mood Trend Chart -->
  <MoodTrendChart moodData={data.moodTrend} />

  <!-- Summary Cards -->
  <div class="grid grid-cols-2 gap-3">
    <!-- Avg Mood -->
    <article
      class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.avgMood")}</p>
      {#if data.thisWeekAvgMood > 0}
        <div class="flex items-baseline gap-2">
          <span class="text-2xl">{moodEmoji(data.thisWeekAvgMood)}</span>
          <span class="text-xl font-bold text-sage"
            >{data.thisWeekAvgMood.toFixed(1)}</span
          >
        </div>
        <p class="text-[10px] mt-1 {moodDeltaColor}">
          {moodDelta > 0 ? "+" : ""}{moodDelta.toFixed(1)}
          {$t("insights.vsLastWeek")} &middot; {moodDeltaLabel}
        </p>
      {:else}
        <p class="text-sm text-slate/40">&mdash;</p>
      {/if}
    </article>

    <!-- Most Common Type -->
    <article
      class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.mostCommonType")}</p>
      {#if topType}
        <div class="flex items-center gap-2">
          <span class="text-2xl">{getTypeIcon(topType.sessionType)}</span>
          <span class="text-sm font-bold text-slate"
            >{$t(`log.types.${topType.sessionType}`)}</span
          >
        </div>
        <p class="text-[10px] mt-1 text-slate/50">
          {topType.count}
          {$t("insights.sessions")}
        </p>
      {:else}
        <p class="text-sm text-slate/40">&mdash;</p>
      {/if}
    </article>

    <!-- Best Time of Day -->
    <article
      class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.bestTimeOfDay")}</p>
      {#if data.insights.bestTimeOfDay}
        <div class="flex items-center gap-2">
          <span class="text-2xl"
            >{timeBucketIcons[data.insights.bestTimeOfDay] || ""}</span
          >
          <span class="text-sm font-bold text-slate">{timeBucketLabel}</span>
        </div>
        <p class="text-[10px] mt-1 text-slate/50">
          mood {data.insights.bestTimeOfDayMood}/5
        </p>
      {:else}
        <p class="text-sm text-slate/40">&mdash;</p>
      {/if}
    </article>

    <!-- Period Totals -->
    <article
      class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.totalThisPeriod")}</p>
      <p class="text-xl font-bold text-sage">
        {data.periodTotals.totalSessions}
      </p>
      <p class="text-[10px] text-slate/50">
        {$t("insights.sessions")} &middot; {data.periodTotals.totalMinutes}
        {$t("insights.minutes")}
      </p>
    </article>
  </div>

  <!-- Streak Cards -->
  <div class="grid grid-cols-2 gap-3">
    <article
      class="rounded-2xl border border-sage/20 bg-gradient-to-br from-sage/5 to-white p-5 shadow-md text-center"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.currentStreak")}</p>
      <p class="text-3xl font-bold text-sage">{data.currentStreak}</p>
      <p class="text-xs text-slate/50">{$t("insights.days")}</p>
    </article>
    <article
      class="rounded-2xl border border-sage/20 bg-gradient-to-br from-sage/5 to-white p-5 shadow-md text-center"
    >
      <p class="text-xs text-slate/60 mb-1">{$t("insights.bestStreak")}</p>
      <p class="text-3xl font-bold text-sage">{data.bestStreak}</p>
      <p class="text-xs text-slate/50">{$t("insights.days")}</p>
    </article>
  </div>

  <!-- Personal Insights -->
  <section>
    <h2 class="text-lg font-bold text-slate mb-3">
      {$t("insights.personalInsights")}
    </h2>
    <div class="space-y-3">
      {#if data.insights.bestMoodType}
        <div
          class="rounded-2xl bg-gradient-to-r from-sage/10 via-white to-cream p-4 border border-sage/20"
        >
          <p class="text-sm text-slate">
            {$t("insights.insightMoodType")}
            <strong class="text-sage"
              >{$t(`log.types.${data.insights.bestMoodType}`)}</strong
            >
            (avg {data.insights.bestMoodTypeAvg}/5)
          </p>
        </div>
      {/if}

      {#if data.insights.busiestWeekday !== null}
        <div
          class="rounded-2xl bg-gradient-to-r from-sage/10 via-white to-cream p-4 border border-sage/20"
        >
          <p class="text-sm text-slate">
            {$t("insights.insightBusiestDay")}
            <strong class="text-sage"
              >{weekdayName(data.insights.busiestWeekday)}</strong
            >
          </p>
        </div>
      {/if}

      {#if data.insights.bestTimeOfDay}
        <div
          class="rounded-2xl bg-gradient-to-r from-sage/10 via-white to-cream p-4 border border-sage/20"
        >
          <p class="text-sm text-slate">
            {timeBucketIcons[data.insights.bestTimeOfDay] || ""}
            {timeBucketLabel}
            {$t("insights.insightBestTime")}
            ({data.insights.bestTimeOfDayMood}/5)
          </p>
        </div>
      {/if}

      {#if !data.insights.bestMoodType && data.insights.busiestWeekday === null && !data.insights.bestTimeOfDay}
        <div
          class="rounded-2xl bg-cream/50 p-6 border border-earth/10 text-center"
        >
          <p class="text-2xl mb-2">{"\u{1F331}"}</p>
          <p class="text-sm text-slate/50">{$t("insights.noMoodData")}</p>
          <a
            href="/timer"
            class="inline-block mt-3 px-4 py-2 bg-sage text-white text-sm font-bold rounded-xl hover:bg-sage/90 transition-colors"
          >
            {$t("dashboard.startTimer")}
          </a>
        </div>
      {/if}
    </div>
  </section>

  <!-- Mood by Type breakdown -->
  {#if data.moodByType.length > 0}
    <section>
      <h2 class="text-lg font-bold text-slate mb-3">
        {$t("stats.meditationTypes")}
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {#each data.moodByType as item}
          <div
            class="rounded-xl bg-white border border-earth/10 p-3 text-center shadow-sm"
          >
            <p class="text-lg">{getTypeIcon(item.sessionType)}</p>
            <p class="text-xs font-medium text-slate mt-1">
              {$t(`log.types.${item.sessionType}`)}
            </p>
            <p class="text-sm font-bold text-sage mt-1">
              {moodEmoji(item.avgMood)}
              {item.avgMood.toFixed(1)}
            </p>
            <p class="text-[10px] text-slate/40">
              {item.count}
              {$t("insights.sessions")}
            </p>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
