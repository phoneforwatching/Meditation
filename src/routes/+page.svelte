<script lang="ts">
  import { getTreeStage, TREE_STAGES } from "$lib/tree";
  import { enhance } from "$app/forms";
  import { t, locale } from "$lib/i18n";
  import { onMount } from "svelte";

  import type { AchievementStatus } from "$lib/achievements";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: stage = getTreeStage(data.totalMinutes);
  $: nextStage = getTreeStage(stage.maxMinutes + 1);
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
  $: achievementPercent = achievements.length
    ? Math.round((unlockedCount / achievements.length) * 100)
    : 0;
  $: currentTreeLevel = Math.max(
    1,
    TREE_STAGES.findIndex((s) => s.id === stage.id) + 1,
  );

  // Calendar Logic
  let currentDate = new Date();

  function changeMonth(delta: number) {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + delta,
      1,
    );
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isSameYearMonth(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth()
    );
  }

  function moveToNextMonth() {
    if (isViewingCurrentMonth) return;
    changeMonth(1);
  }

  $: calendarDays = getDaysInMonth(currentDate);

  // Animation states
  let mounted = false;
  let showStats = false;
  let showAchievements = false;
  let showCalendar = false;
  let showSavedToast = false;
  let savedMinutes = 0;

  onMount(() => {
    mounted = true;
    setTimeout(() => (showStats = true), 200);
    setTimeout(() => (showAchievements = true), 400);
    setTimeout(() => (showCalendar = true), 600);

    const params = new URLSearchParams(window.location.search);
    if (params.get("logged") === "1") {
      savedMinutes = Math.max(0, Number(params.get("minutes") || 0));
      showSavedToast = true;
      setTimeout(() => {
        showSavedToast = false;
      }, 3200);

      params.delete("logged");
      params.delete("minutes");
      const query = params.toString();
      const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
    }
  });

  // Get greeting based on time
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return $locale === "th" ? "อรุณสวัสดิ์" : "Good morning";
    if (hour < 17) return $locale === "th" ? "สวัสดีตอนบ่าย" : "Good afternoon";
    return $locale === "th" ? "สวัสดีตอนเย็น" : "Good evening";
  }

  // Format time nicely
  function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }

  function getBadgeRemainingText(
    remaining: number,
    type: AchievementStatus["type"],
  ) {
    const unit =
      type === "streak"
        ? $t("badges.days")
        : type === "time"
          ? $t("badges.minutes")
          : $t("badges.sessions");

    return $locale === "th"
      ? `${$t("badges.toGo")} ${remaining} ${unit}`
      : `${remaining} ${unit} ${$t("badges.toGo")}`;
  }

  // Today's meditation check
  $: todayStr = toDateKey(new Date());
  $: meditatedToday = data.dailyMinutes[todayStr] > 0;
  $: todayMinutes = data.dailyMinutes[todayStr] || 0;
  $: dailyGoalMinutes = Math.max(1, Number(data.dailyGoalMinutes ?? 10));
  $: dailyGoalProgress = Math.min(
    100,
    Math.round((todayMinutes / dailyGoalMinutes) * 100),
  );
  $: goalRemainingMinutes = Math.max(0, dailyGoalMinutes - todayMinutes);

  // Monthly summary for selected month in calendar
  $: currentMonthPrefix = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  $: monthEntries = Object.entries(data.dailyMinutes).filter(([date]) =>
    date.startsWith(currentMonthPrefix),
  );
  $: monthActiveDays = monthEntries.filter(([, mins]) => mins > 0).length;
  $: monthTotalMinutes = monthEntries.reduce((total, [, mins]) => total + mins, 0);
  $: monthMaxDaily =
    monthEntries.length > 0 ? Math.max(...monthEntries.map(([, mins]) => mins)) : 0;
  $: currentMonthDayCount = calendarDays.filter((d) => d).length;
  $: isViewingCurrentMonth = isSameYearMonth(currentDate, new Date());
</script>

<div class="min-h-screen bg-gradient-to-b from-cream/50 to-white pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
  <!-- Enhanced Hero Section -->
  <section
    class="relative overflow-hidden rounded-b-[4rem] pt-8 pb-6 mb-3 -mx-4 px-4"
    class:opacity-0={!mounted}
    class:translate-y-4={!mounted}
    style="transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);"
  >
    <!-- Background Gradient Mesh -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-sage/5 via-cream to-peach/5"
    ></div>
    
    <!-- Animated Gradient Orbs -->
    <div
      class="absolute top-1/4 -left-20 w-80 h-80 bg-gradient-to-r from-sage/10 to-teal-400/10 rounded-full blur-3xl animate-float"
    ></div>
    <div
      class="absolute bottom-1/4 -right-20 w-80 h-80 bg-gradient-to-l from-peach/10 to-amber-400/10 rounded-full blur-3xl animate-float"
      style="animation-delay: 2s;"
    ></div>
    
    <!-- Glassmorphism Container -->
    <div
      class="relative max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl shadow-sage/10 overflow-hidden"
    >
      <!-- Inner Glow -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-sage/5 via-transparent to-peach/5"
      ></div>
      
      <div class="relative p-8 md:p-12">
        <!-- Greeting with Avatar -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-emerald-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-sage/30 overflow-hidden"
              >
                {#if data.user?.avatarUrl}
                  <img
                    src={data.user.avatarUrl}
                    alt={data.user?.displayName || "User"}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  {data.user?.displayName?.charAt(0) ||
                    data.user?.email?.charAt(0).toUpperCase() || "🌿"}
                {/if}
              </div>
              <!-- Online indicator -->
              <div
                class="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"
              ></div>
            </div>
            <div>
              <p class="text-sm text-sage/80 font-medium tracking-wide uppercase">
                {getGreeting()}
              </p>
              <h1 class="text-2xl md:text-3xl font-bold text-slate">
                {data.user?.displayName || data.user?.email?.split("@")[0] || $t("dashboard.friend")}!
              </h1>
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div class="hidden md:flex items-center gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-sage">{data.streak}</div>
              <div class="text-xs text-slate/50 uppercase tracking-wider">{$t("dashboard.days")}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-sage">{data.totalSessions}</div>
              <div class="text-xs text-slate/50 uppercase tracking-wider">{$t("dashboard.sessions")}</div>
            </div>
          </div>
        </div>
        
        <!-- Main Content Row -->
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <!-- Tree Visualization - Enhanced -->
          <div class="flex-1 flex flex-col items-center">
            <div class="relative">
              <!-- Animated Rings -->
              <div class="absolute inset-0 animate-spin-slow">
                <div
                  class="absolute inset-0 border-2 border-sage/20 rounded-full"
                ></div>
                <div
                  class="absolute inset-4 border-2 border-peach/20 rounded-full"
                  style="animation-delay: -0.5s;"
                ></div>
              </div>
              
              <!-- Glowing Orb -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-sage/20 to-teal-400/20 rounded-full blur-2xl animate-pulse"
              ></div>
              
              <!-- Tree Container -->
              <div
                class="relative w-48 h-48 rounded-full bg-gradient-to-br from-white via-cream to-white/90 border-2 border-white/60 shadow-2xl shadow-sage/20 flex items-center justify-center group hover:scale-105 transition-all duration-500"
              >
                <!-- Tree Symbol with Particle Effect -->
                <span
                  class="text-8xl transform group-hover:scale-110 transition-transform duration-500 cursor-default select-none animate-breathe"
                >
                  {stage.symbol}
                </span>
                
                <!-- Floating Particles -->
                <div
                  class="absolute -top-2 -right-2 w-4 h-4 bg-sage/30 rounded-full animate-bounce-short"
                ></div>
                <div
                  class="absolute -bottom-2 -left-2 w-3 h-3 bg-peach/30 rounded-full animate-bounce-short"
                  style="animation-delay: 0.3s;"
                ></div>
              </div>
              
              <!-- Level Indicator -->
              {#if isMaxStage}
                <div class="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <div
                    class="px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white text-sm font-bold rounded-full shadow-xl shadow-amber-400/30 animate-pulse"
                  >
                    ✨ {$t("dashboard.maxLevelReached")}
                  </div>
                </div>
              {:else}
                <div class="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <div
                    class="px-3 py-1 bg-gradient-to-r from-sage to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg"
                  >
                    {$t("dashboard.level")} {currentTreeLevel}
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Tree Info -->
            <div class="mt-8 text-center max-w-md">
              <h2 class="text-2xl font-bold text-slate mb-2">
                {$t(`tree.${stage.id}.name`)}
              </h2>
              <p class="text-sage/70 text-sm leading-relaxed">
                {$t(`tree.${stage.id}.desc`)}
              </p>
            </div>
          </div>
          
          <!-- Progress & Stats Sidebar -->
          <div class="flex-1 w-full max-w-md">
            <!-- Progress Card -->
            <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-slate">{$t("dashboard.journeyProgress")}</h3>
                <span class="text-sm font-bold text-sage">
                  {formatMinutes(data.totalMinutes)}
                </span>
              </div>
              
              {#if !isMaxStage}
                <!-- Animated Progress Bar -->
                <div class="space-y-3">
                  <div class="relative h-3 bg-gradient-to-r from-cream to-cream/50 rounded-full overflow-hidden">
                    <div
                      class="absolute inset-0 bg-gradient-to-r from-sage via-emerald-400 to-teal-300 rounded-full transition-all duration-1000 ease-out"
                      style="width: {progressPercent}%"
                    >
                      <!-- Shimmer Effect -->
                      <div
                        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                      ></div>
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-slate/60">
                      {stage.minMinutes} {$t("stats.minutes")}
                    </span>
                    <span class="font-bold text-sage">
                      {progressPercent.toFixed(0)}%
                    </span>
                    <span class="text-slate/60">
                      {stage.maxMinutes} {$t("stats.minutes")}
                    </span>
                  </div>
                  
                  <!-- Next Level Info -->
                  <div class="mt-4 p-4 bg-gradient-to-r from-sage/5 to-sage/10 rounded-xl">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-xs text-slate/50">{$t("dashboard.nextLevel")}</p>
                        <p class="font-bold text-slate">{$t(`tree.${nextStage.id}.name`)}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-slate/50">{$t("dashboard.minutesNeeded")}</p>
                        <p class="font-bold text-sage">
                          {stage.maxMinutes + 1 - data.totalMinutes} {$t("stats.minutes")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Daily Status & Stats - Redesigned -->
  <section
    class="max-w-4xl mx-auto -mt-1 px-4 mb-10"
    class:opacity-0={!showStats}
    class:translate-y-4={!showStats}
    style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;"
  >
    <div class="space-y-5">
      <!-- Today's Status Card -->
      {#if meditatedToday}
        <article
          class="relative overflow-hidden rounded-3xl border border-sage/20 bg-gradient-to-br from-sage/10 via-white/90 to-emerald-100/70 p-5 sm:p-6 shadow-lg shadow-sage/10"
        >
          <div
            class="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-gradient-to-br from-sage/20 to-emerald-400/20 blur-2xl"
          ></div>
          <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-4">
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage to-emerald-500 text-3xl text-white shadow-lg shadow-sage/30"
              >
                ✅
              </div>
              <div class="space-y-2">
                <p class="text-lg font-bold text-sage">
                  {$t("dashboard.meditatedToday")}
                </p>
                <p class="text-sm text-slate/70">
                  {todayMinutes}
                  {$t("stats.minutes")}
                  {$t("dashboard.today")}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    class="rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold text-sage"
                  >
                    🔥 {data.streak}
                    {$t("dashboard.dayStreak")}
                  </span>
                  <span
                    class="rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold text-sage"
                  >
                    ⭐ {unlockedCount}
                    {$t("dashboard.badges")}
                  </span>
                </div>
              </div>
            </div>
            <a
              href="/timer"
              class="inline-flex min-h-11 min-w-[9rem] items-center justify-center rounded-xl bg-gradient-to-r from-sage to-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sage/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sage/40"
            >
              {$t("dashboard.primaryCta")}
            </a>
          </div>
        </article>
      {:else}
        <article
          class="relative overflow-hidden rounded-3xl border border-peach/25 bg-gradient-to-br from-peach/20 via-white/90 to-amber-100/80 p-5 sm:p-6 shadow-lg shadow-peach/10"
        >
          <div
            class="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-gradient-to-br from-peach/20 to-amber-300/30 blur-2xl"
          ></div>
          <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-4">
              <div
                class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-peach to-amber-400 text-3xl shadow-lg shadow-peach/30"
              >
                🧘
              </div>
              <div class="space-y-2">
                <p class="text-lg font-bold text-slate">
                  {$t("dashboard.notMeditatedToday")}
                </p>
                <p class="text-sm text-slate/70">
                  {$t("dashboard.keepStreak")}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    class="rounded-full bg-peach/15 px-3 py-1 text-xs font-semibold text-peach"
                  >
                    🔥 {data.streak}
                    {$t("dashboard.dayStreak")}
                  </span>
                  <span
                    class="rounded-full bg-peach/15 px-3 py-1 text-xs font-semibold text-peach"
                  >
                    ⏱️ {formatMinutes(data.totalMinutes)}
                    {$t("dashboard.total")}
                  </span>
                </div>
              </div>
            </div>
            <a
              href="/timer"
              class="inline-flex min-h-11 min-w-[9rem] items-center justify-center rounded-xl bg-gradient-to-r from-peach to-amber-400 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-peach/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-peach/40"
            >
              {$t("dashboard.primaryCta")}
            </a>
          </div>
        </article>
      {/if}

      <!-- Daily Goal -->
      <article class="rounded-2xl border border-sage/20 bg-white/85 p-4 shadow-md shadow-sage/5 sm:p-5">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h3 class="text-sm font-bold text-slate sm:text-base">{$t("dashboard.dailyGoal")}</h3>
          <span class="rounded-full bg-sage/10 px-2.5 py-1 text-xs font-semibold text-sage">
            {todayMinutes}/{dailyGoalMinutes}m
          </span>
        </div>
        <div class="h-2.5 w-full overflow-hidden rounded-full bg-sage/10">
          <div
            class="h-full rounded-full bg-gradient-to-r from-sage to-emerald-500 transition-all duration-700"
            style={`width:${dailyGoalProgress}%`}
          ></div>
        </div>
        <p class="mt-2 text-xs text-slate/70 sm:text-sm">
          {#if goalRemainingMinutes === 0}
            {$t("dashboard.goalDone")}
          {:else}
            {$locale === "th"
              ? `อีก ${goalRemainingMinutes} นาที เพื่อครบเป้าหมายวันนี้`
              : `${goalRemainingMinutes} minutes left to hit today's goal`}
          {/if}
        </p>
      </article>

      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-3 sm:gap-4">
        <article
          class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md shadow-sage/5"
        >
          <p class="mb-2 text-xl">🔥</p>
          <p class="text-2xl font-bold leading-none text-sage sm:text-3xl">{data.streak}</p>
          <p class="mt-2 text-xs font-medium text-slate/60 sm:text-sm">{$t("dashboard.streak")}</p>
        </article>
        <article
          class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md shadow-sage/5"
        >
          <p class="mb-2 text-xl">⏱️</p>
          <p class="text-2xl font-bold leading-none text-sage sm:text-3xl">
            {formatMinutes(data.totalMinutes)}
          </p>
          <p class="mt-2 text-xs font-medium text-slate/60 sm:text-sm">
            {$t("dashboard.totalMinutes")}
          </p>
        </article>
        <article
          class="rounded-2xl border border-white/50 bg-gradient-to-br from-white to-cream p-4 shadow-md shadow-sage/5"
        >
          <p class="mb-2 text-xl">🧘</p>
          <p class="text-2xl font-bold leading-none text-sage sm:text-3xl">{data.totalSessions}</p>
          <p class="mt-2 text-xs font-medium text-slate/60 sm:text-sm">{$t("dashboard.sessions")}</p>
        </article>
      </div>
    </div>
  </section>


  <!-- Achievements Section - Redesigned -->
  <section
    class="max-w-4xl mx-auto px-4 mb-12"
    class:opacity-0={!showAchievements}
    class:translate-y-4={!showAchievements}
    style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;"
  >
    <!-- Header with Progress -->
    <div class="bg-gradient-to-r from-white/80 to-cream/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/40 shadow-lg">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate mb-2">{$t("badges.title")}</h2>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="relative w-32 h-2 bg-gradient-to-r from-cream to-cream/50 rounded-full overflow-hidden">
                <div
                  class="absolute inset-0 bg-gradient-to-r from-sage via-emerald-400 to-teal-300 rounded-full transition-all duration-1000"
                  style="width: {achievements.length ? (unlockedCount / achievements.length) * 100 : 0}%"
                ></div>
              </div>
              <span class="text-sm font-bold text-sage">
                {unlockedCount}/{achievements.length}
              </span>
            </div>
            <span class="text-sm text-sage/70 font-medium">
              {achievementPercent}% {$t("badges.unlocked")}
            </span>
          </div>
        </div>
        
        {#if nextBadge}
          <div class="bg-gradient-to-r from-sage/5 to-sage/10 rounded-xl p-4 border border-sage/20">
            <p class="text-xs text-slate/50 uppercase tracking-wider font-medium mb-1">
              {$t("badges.next")}
            </p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center text-xl">
                {nextBadge.icon}
              </div>
              <div>
                <p class="font-bold text-slate text-sm">{$t(`badges.${nextBadge.id}.name`)}</p>
                <p class="text-xs text-sage font-medium">
                  {getBadgeRemainingText(
                    Math.max(0, nextBadge.threshold - nextBadge.current),
                    nextBadge.type,
                  )}
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Achievements Grid -->
    {#if achievements.length === 0}
      <div class="rounded-2xl border border-sage/20 bg-gradient-to-r from-sage/5 to-sage/10 p-6 text-center">
        <p class="text-sm font-semibold text-slate">{$t("badges.emptyTitle")}</p>
        <p class="mt-1 text-xs text-slate/60">{$t("badges.emptySubtitle")}</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each achievements as badge, i}
          {@const remaining = Math.max(0, badge.threshold - badge.current)}
          {@const progressPercent = Math.min(100, Math.round(badge.progress * 100))}
          
          <div
            class="group relative bg-gradient-to-br from-white via-cream to-white/90 rounded-2xl border border-white/40 p-5 shadow-lg hover:shadow-xl hover:border-sage/20 transition-all duration-300 hover:-translate-y-1 {badge.achieved ? '' : 'opacity-80'}"
            style="animation-delay: {i * 50}ms;"
          >
            <!-- Achievement Glow Effect -->
            {#if badge.achieved}
              <div
                class="absolute inset-0 bg-gradient-to-br from-sage/5 to-emerald-400/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"
              ></div>
            {/if}
            
            <div class="relative">
              <!-- Badge Header -->
              <div class="flex items-center justify-between mb-4">
                <div
                  class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg {badge.achieved
                    ? 'bg-gradient-to-br from-sage to-emerald-500 text-white animate-pulse-soft'
                    : 'bg-gradient-to-br from-earth/20 to-earth/10 text-slate/50'}"
                >
                  {badge.icon}
                </div>
                
                {#if badge.achieved}
                  <span
                    class="text-xs font-bold bg-gradient-to-r from-sage to-emerald-500 text-white px-3 py-1.5 rounded-full shadow-md"
                  >
                    <span class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
                      {$t("badges.unlocked")}
                    </span>
                  </span>
                {:else}
                  <span class="text-xs font-medium text-slate/40 bg-white/50 px-3 py-1.5 rounded-full">
                    {progressPercent}%
                  </span>
                {/if}
              </div>
              
              <!-- Badge Info -->
              <div class="space-y-3">
                <div>
                  <h3 class="font-bold text-slate text-sm mb-1 truncate">
                    {$t(`badges.${badge.id}.name`)}
                  </h3>
                  {#if badge.achieved}
                    <p class="text-xs text-sage/70 font-medium">🎉 {$t("badges.achieved")}</p>
                  {:else}
                    <p class="text-xs text-slate/50">
                      {getBadgeRemainingText(remaining, badge.type)}
                    </p>
                  {/if}
                </div>
                
                <!-- Progress Bar -->
                <div class="space-y-2">
                  <div class="h-1.5 bg-gradient-to-r from-cream to-cream/50 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-1000 {badge.achieved
                        ? 'bg-gradient-to-r from-sage via-emerald-400 to-teal-300'
                        : 'bg-gradient-to-r from-earth/40 to-earth/60'}"
                      style="width: {progressPercent}%"
                    >
                      <!-- Shimmer Effect for achieved badges -->
                      {#if badge.achieved}
                        <div
                          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                        ></div>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="flex justify-between text-xs">
                    <span class="text-slate/50">0</span>
                    <span class="font-medium text-sage">{badge.threshold}</span>
                  </div>
                </div>
                
                <!-- Current Progress -->
                <div class="flex items-center justify-between pt-2 border-t border-white/30">
                  <span class="text-xs text-slate/50">{$t("dashboard.current")}</span>
                  <span class="text-sm font-bold text-sage">
                    {badge.current}/{badge.threshold}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Achievement Unlocked Celebration -->
            {#if badge.achieved}
              <div
                class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-lg"
              >
                ✨
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    
  </section>

  <!-- Calendar Section - Enhanced Design -->
  <section
    class="max-w-4xl mx-auto px-4 mb-12"
    class:opacity-0={!showCalendar}
    class:translate-y-4={!showCalendar}
    style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;"
  >
    <div class="bg-gradient-to-br from-white via-cream to-white/90 rounded-3xl border border-white/40 shadow-xl overflow-hidden">
      <!-- Calendar Header -->
      <div class="bg-gradient-to-r from-sage/5 to-sage/10 p-6 border-b border-white/40">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-slate mb-1">{$t("stats.history")}</h2>
            <p class="text-sm text-sage/70">
              {$t("stats.historySubtitle")}
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- Month Navigation -->
            <div class="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-white/40">
              <button
                class="w-10 h-10 min-h-11 rounded-lg hover:bg-sage/10 flex items-center justify-center text-slate/60 hover:text-sage transition-colors"
                on:click={() => changeMonth(-1)}
                aria-label={$t("stats.previousMonth")}
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              
              <div class="text-center min-w-[140px]">
                <span class="font-bold text-lg text-sage">
                  {currentDate.toLocaleString($locale === "th" ? "th-TH" : "en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <p class="text-xs text-slate/40">
                  {currentMonthDayCount} {$t("dashboard.days")}
                </p>
              </div>
              
              <button
                class="w-10 h-10 min-h-11 rounded-lg hover:bg-sage/10 flex items-center justify-center text-slate/60 hover:text-sage transition-colors disabled:cursor-not-allowed disabled:text-slate/30 disabled:hover:bg-transparent"
                on:click={moveToNextMonth}
                aria-label={$t("stats.nextMonth")}
                disabled={isViewingCurrentMonth}
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            
            <!-- Today Button -->
            <button
              class="min-h-11 px-4 py-2 bg-gradient-to-r from-sage to-emerald-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-sage/30 transition-all"
              on:click={() => {
                const now = new Date();
                currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
              }}
            >
              {$t("dashboard.today")}
            </button>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Day headers -->
        <div class="grid grid-cols-7 gap-2 mb-3">
          {#each $locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["S", "M", "T", "W", "T", "F", "S"] as day}
            <div class="text-center text-sm font-bold text-sage py-2">
              {day}
            </div>
          {/each}
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-2">
          {#each calendarDays as day}
            {#if day}
              {@const dateStr = toDateKey(day)}
              {@const minutes = data.dailyMinutes[dateStr] || 0}
              {@const intensity = Math.min(1, minutes / 60)}
              {@const isToday = dateStr === todayStr}
              {@const colorIntensity = Math.floor(intensity * 4)}

              <div
                class="aspect-square rounded-xl flex flex-col items-center justify-center relative group cursor-default transition-all duration-300 hover:scale-105 hover:z-10"
                class:ring-2={isToday}
                class:ring-sage={isToday}
                class:ring-offset-2={isToday}
              >
                <!-- Background based on minutes -->
                <div
                  class="absolute inset-1 rounded-lg transition-all duration-300 group-hover:inset-0.5
                    {minutes === 0
                      ? 'bg-gradient-to-br from-cream to-cream/80 border border-white/40'
                      : colorIntensity === 0
                      ? 'bg-gradient-to-br from-sage/20 to-sage/30'
                      : colorIntensity === 1
                      ? 'bg-gradient-to-br from-sage/40 to-sage/50'
                      : colorIntensity === 2
                      ? 'bg-gradient-to-br from-sage/60 to-sage/70'
                      : colorIntensity === 3
                      ? 'bg-gradient-to-br from-sage/80 to-sage/90'
                      : 'bg-gradient-to-br from-sage to-emerald-500'}"
                >
                  <!-- Hover glow effect -->
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 rounded-lg group-hover:via-white/10 group-hover:to-white/20 transition-all"
                  ></div>
                </div>
                
                <!-- Day number -->
                <span class="relative text-sm font-bold {minutes > 0 ? 'text-white' : 'text-slate/60'} mb-1">
                  {day.getDate()}
                </span>
                
                <!-- Minutes indicator -->
                {#if minutes > 0}
                  <span class="relative text-[10px] font-bold text-white/90 bg-black/20 px-1.5 py-0.5 rounded-full">
                    {minutes}m
                  </span>
                {:else}
                  <span class="relative text-[8px] text-slate/40">-</span>
                {/if}

                <!-- Enhanced Tooltip -->
                <div
                  class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-slate to-slate/90 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-all duration-300 shadow-2xl border border-white/10 backdrop-blur-sm"
                >
                  <div class="font-bold mb-1">
                    {day.toLocaleDateString(
                      $locale === "th" ? "th-TH" : "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-sage"></div>
                    <div>
                      {minutes > 0
                        ? `${minutes} ${$t("stats.minutes")}`
                        : $t("stats.noActivity")}
                    </div>
                  </div>
                  {#if isToday}
                    <div class="mt-2 text-xs text-sage/80 font-medium">
                      📍 {$t("dashboard.today")}
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="aspect-square"></div>
            {/if}
          {/each}
        </div>

        <!-- Stats & Legend -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Legend -->
          <div class="bg-gradient-to-br from-white/50 to-cream/30 rounded-xl p-4 border border-white/40">
            <h3 class="text-sm font-bold text-slate mb-3">{$t("stats.intensityTitle")}</h3>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-cream to-cream/80 border border-white/40"></div>
                <span class="text-xs text-slate/60">{$t("stats.intensityNone")}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-sage/20 to-sage/30"></div>
                <span class="text-xs text-slate/60">{$t("stats.intensityLight")}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-sage/60 to-sage/70"></div>
                <span class="text-xs text-slate/60">{$t("stats.intensityMedium")}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-sage to-emerald-500"></div>
                <span class="text-xs text-slate/60">{$t("stats.intensityHigh")}</span>
              </div>
            </div>
          </div>
          
          <!-- Quick Stats -->
          <div class="bg-gradient-to-br from-sage/5 to-sage/10 rounded-xl p-4 border border-sage/20">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate">{$t("stats.thisMonth")}</h3>
              {#if monthTotalMinutes === 0}
                <span class="rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-slate/55">
                  {$t("stats.noActivityYet")}
                </span>
              {/if}
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-lg border border-white/50 bg-white/70 px-2 py-3 text-center">
                <div class="text-xl font-bold text-sage">{monthActiveDays}</div>
                <div class="mt-1 text-[11px] font-medium text-sage/70">{$t("stats.activeDays")}</div>
              </div>
              <div class="rounded-lg border border-white/50 bg-white/70 px-2 py-3 text-center">
                <div class="text-xl font-bold text-sage">{formatMinutes(monthTotalMinutes)}</div>
                <div class="mt-1 text-[11px] font-medium text-sage/70">{$t("stats.totalMinutes")}</div>
              </div>
              <div class="rounded-lg border border-white/50 bg-white/70 px-2 py-3 text-center">
                <div class="text-xl font-bold text-sage">{formatMinutes(monthMaxDaily)}</div>
                <div class="mt-1 text-[11px] font-medium text-sage/70">{$t("stats.maxDaily")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Session Types - Redesigned -->
  {#if Object.keys(data.typeDistribution).length > 0}
    <section class="max-w-4xl mx-auto px-4 mb-12">
      <div class="bg-gradient-to-br from-white via-cream to-white/90 rounded-2xl border border-white/40 p-6 shadow-xl">
        <h2 class="text-2xl font-bold text-slate mb-6">
          {$t("stats.meditationTypes")}
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {#each Object.entries(data.typeDistribution) as [type, count]}
            <div
              class="group bg-gradient-to-br from-white to-cream rounded-xl border border-white/40 p-4 text-center hover:border-sage/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-sage/10 to-sage/20 flex items-center justify-center text-xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                {#if type === "Focus"}📍
                {:else if type === "Breathing"}🌬️
                {:else if type === "Sleep"}😴
                {:else if type === "Mindfulness"}🧘
                {:else if type === "Loving-Kindness"}💖
                {:else}✨{/if}
              </div>
              <p class="font-bold text-slate text-sm mb-1 truncate">{type}</p>
              <p class="text-xs text-sage font-medium">{count} {$t("stats.sessions")}</p>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <!-- Recent History - Enhanced -->
  <section class="max-w-4xl mx-auto px-4 pb-12">
    <div class="bg-gradient-to-br from-white via-cream to-white/90 rounded-2xl border border-white/40 p-6 shadow-xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-slate">{$t("dashboard.recentHistory")}</h2>
        <a
          href="/history"
          class="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-sage transition-colors hover:text-emerald-600"
        >
          {$t("history.viewAll")}
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>
      
      {#if data.recentSessions.length === 0}
        <div class="text-center py-12">
          <div class="text-6xl mb-4 text-sage/30">🧘</div>
          <p class="text-slate/60 font-medium mb-2">{$t("dashboard.noSessions")}</p>
          <p class="text-sm text-slate/50">{$t("dashboard.startHint")}</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each data.recentSessions as session}
            <div
              class="group bg-gradient-to-r from-white via-cream to-white/50 rounded-xl border border-white/40 p-4 flex items-center gap-4 hover:border-sage/20 hover:shadow-md transition-all duration-300"
            >
              <!-- Session Icon -->
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-sage/10 to-sage/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform"
              >
                {#if session.sessionType === "Focus"}📍
                {:else if session.sessionType === "Breathing"}🌬️
                {:else if session.sessionType === "Sleep"}😴
                {:else if session.sessionType === "Mindfulness"}🧘
                {:else if session.sessionType === "Loving-Kindness"}💖
                {:else}✨{/if}
              </div>

              <!-- Session Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <p class="font-bold text-slate text-sm truncate">
                    {session.sessionType}
                  </p>
                  <span class="font-mono font-bold text-sage text-sm bg-sage/10 px-2 py-1 rounded-lg">
                    {session.durationMinutes}m
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <p class="text-xs text-slate/50">
                    {session.completedAt
                      ? new Date(session.completedAt).toLocaleString(
                          $locale === "th" ? "th-TH" : "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : ""}
                  </p>
                  
                  {#if session.moodRating}
                    <div class="flex items-center gap-1">
                      <span class="text-xs text-slate/50">{$t("history.mood")}:</span>
                      <span class="text-lg" title="Mood: {session.moodRating}/5">
                        {["", "😫", "😕", "😐", "🙂", "😊"][session.moodRating]}
                      </span>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Delete Button -->
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
                class="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
              >
                <input type="hidden" name="id" value={session.id} />
                <button
                  type="submit"
                  class="h-11 w-11 rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                  title={$t("dashboard.delete")}
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </form>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  {#if showSavedToast}
    <div
      class="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-md rounded-xl border border-sage/30 bg-white/95 px-4 py-3 shadow-xl shadow-sage/20 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <p class="text-sm font-semibold text-sage">
        {$locale === "th"
          ? `บันทึกแล้ว +${savedMinutes} นาที`
          : `Saved +${savedMinutes} minutes`}
      </p>
    </div>
  {/if}
</div>
