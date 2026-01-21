<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { enhance } from "$app/forms";
  import { t, locale } from "$lib/i18n";
  import { onMount } from "svelte";

  // shadcn components
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { Badge } from "$lib/components/ui/badge";

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

  function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
  }

  $: calendarDays = getDaysInMonth(currentDate);

  // Animation states
  let mounted = false;
  let showStats = false;
  let showAchievements = false;
  let showCalendar = false;
  
  onMount(() => {
    mounted = true;
    setTimeout(() => showStats = true, 200);
    setTimeout(() => showAchievements = true, 400);
    setTimeout(() => showCalendar = true, 600);
  });

  // Get greeting based on time
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return $locale === 'th' ? 'อรุณสวัสดิ์' : 'Good morning';
    if (hour < 17) return $locale === 'th' ? 'สวัสดีตอนบ่าย' : 'Good afternoon';
    return $locale === 'th' ? 'สวัสดีตอนเย็น' : 'Good evening';
  }

  // Format time nicely
  function formatMinutes(mins: number) {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }

  // Today's meditation check
  $: todayStr = new Date().toISOString().split('T')[0];
  $: meditatedToday = data.dailyMinutes[todayStr] > 0;
  $: todayMinutes = data.dailyMinutes[todayStr] || 0;
</script>

<div class="min-h-screen pb-8">
  <!-- Hero Section with Greeting -->
  <section 
    class="relative overflow-hidden rounded-b-[3rem] bg-gradient-to-br from-sage/10 via-cream to-sage/5 pt-4 pb-12 mb-8 -mx-4 px-4"
    class:opacity-0={!mounted}
    class:translate-y-4={!mounted}
    style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);"
  >
    <!-- Decorative circles -->
    <div class="absolute top-0 right-0 w-64 h-64 bg-sage/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-48 h-48 bg-peach/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
    
    <div class="relative max-w-lg mx-auto">
      <!-- Greeting -->
      <div class="text-center mb-6">
        <p class="text-sm text-sage/80 font-medium tracking-wide">
          {getGreeting()}, {data.user?.displayName || data.user?.email?.split('@')[0] || 'Friend'} 👋
        </p>
      </div>

      <!-- Tree Visual - Center piece -->
      <div class="flex flex-col items-center">
        <!-- Tree Symbol with enhanced glow -->
        <div class="relative mb-4">
          <!-- Outer glow rings -->
          <div class="absolute inset-0 scale-150">
            <div class="absolute inset-0 bg-sage/10 rounded-full blur-3xl animate-breathe"></div>
          </div>
          <div class="absolute inset-0 scale-125">
            <div class="absolute inset-0 bg-sage/20 rounded-full blur-2xl animate-breathe" style="animation-delay: 0.5s;"></div>
          </div>
          
          <!-- Main tree container -->
          <div class="relative w-36 h-36 rounded-full bg-gradient-to-br from-white to-sage/5 border border-sage/10 shadow-2xl shadow-sage/20 flex items-center justify-center">
            <span class="text-7xl transform hover:scale-110 transition-transform duration-300 cursor-default select-none animate-pulse-soft">
              {stage.symbol}
            </span>
          </div>
          
          <!-- Level badge -->
          {#if isMaxStage}
            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div class="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-lg">
                ✨ MAX LEVEL
              </div>
            </div>
          {/if}
        </div>

        <!-- Tree name and description -->
        <h1 class="text-2xl font-bold text-slate text-center mb-1">
          {$t(`tree.${stage.id}.name`)}
        </h1>
        <p class="text-sm text-slate/60 text-center max-w-xs mb-6">
          {$t(`tree.${stage.id}.desc`)}
        </p>

        <!-- Progress to next level -->
        {#if !isMaxStage}
          <div class="w-full max-w-xs space-y-2">
            <div class="relative">
              <Progress value={progressPercent} class="h-2.5 bg-sage/10" />
              <!-- Progress glow effect -->
              <div 
                class="absolute top-0 left-0 h-2.5 bg-sage/40 rounded-full blur-sm transition-all duration-500"
                style="width: {progressPercent}%"
              ></div>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate/50">{data.totalMinutes} min</span>
              <span class="text-sage font-medium">
                {stage.maxMinutes + 1 - data.totalMinutes} min → {$t(`tree.${nextStage.id}.name`)}
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- Today's Status Card -->
  <section 
    class="max-w-lg mx-auto mb-6 px-1"
    class:opacity-0={!showStats}
    class:translate-y-4={!showStats}
    style="transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;"
  >
    {#if meditatedToday}
      <div class="bg-gradient-to-r from-sage/10 to-sage/5 border border-sage/20 rounded-2xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-sage/20 flex items-center justify-center text-2xl">
          ✅
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-sage">
            {$locale === 'th' ? 'ทำสมาธิวันนี้แล้ว!' : 'Meditated today!'}
          </p>
          <p class="text-xs text-slate/60">
            {todayMinutes} {$locale === 'th' ? 'นาที' : 'minutes'} {$locale === 'th' ? 'วันนี้' : 'today'}
          </p>
        </div>
        <Button variant="default" size="sm" class="rounded-full">
          <a href="/timer">+ {$locale === 'th' ? 'เพิ่ม' : 'More'}</a>
        </Button>
      </div>
    {:else}
      <div class="bg-gradient-to-r from-peach/20 to-peach/10 border border-peach/30 rounded-2xl p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-peach/30 flex items-center justify-center text-2xl animate-bounce-short">
          🧘
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-slate">
            {$locale === 'th' ? 'ยังไม่ได้ทำสมาธิวันนี้' : "Haven't meditated today"}
          </p>
          <p class="text-xs text-slate/60">
            {$locale === 'th' ? 'รักษา streak ไว้!' : 'Keep your streak going!'}
          </p>
        </div>
        <Button variant="default" size="sm" class="rounded-full shadow-lg shadow-sage/30">
          <a href="/timer">{$locale === 'th' ? 'เริ่มเลย' : 'Start'}</a>
        </Button>
      </div>
    {/if}
  </section>

  <!-- Stats Grid - Compact & Beautiful -->
  <section 
    class="max-w-lg mx-auto mb-8 px-1"
    class:opacity-0={!showStats}
    class:translate-y-4={!showStats}
    style="transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;"
  >
    <div class="grid grid-cols-3 gap-3">
      <!-- Streak -->
      <div class="group relative bg-white rounded-2xl p-4 border border-earth/10 shadow-sm hover:shadow-md hover:border-sage/20 transition-all duration-300 hover:-translate-y-0.5">
        <div class="absolute top-3 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
          🔥
        </div>
        <p class="text-3xl font-bold text-sage mb-1">{data.streak}</p>
        <p class="text-xs text-slate/50 uppercase tracking-wider font-medium">
          {$t("dashboard.streak")}
        </p>
        {#if data.streak >= 7}
          <div class="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-[10px] border-2 border-white">
            🎯
          </div>
        {/if}
      </div>

      <!-- Total Time -->
      <div class="group relative bg-white rounded-2xl p-4 border border-earth/10 shadow-sm hover:shadow-md hover:border-sage/20 transition-all duration-300 hover:-translate-y-0.5">
        <div class="absolute top-3 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
          ⏱️
        </div>
        <p class="text-3xl font-bold text-sage mb-1">{formatMinutes(data.totalMinutes)}</p>
        <p class="text-xs text-slate/50 uppercase tracking-wider font-medium">
          {$locale === 'th' ? 'รวม' : 'Total'}
        </p>
      </div>

      <!-- Sessions -->
      <div class="group relative bg-white rounded-2xl p-4 border border-earth/10 shadow-sm hover:shadow-md hover:border-sage/20 transition-all duration-300 hover:-translate-y-0.5">
        <div class="absolute top-3 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
          🧘
        </div>
        <p class="text-3xl font-bold text-sage mb-1">{data.totalSessions}</p>
        <p class="text-xs text-slate/50 uppercase tracking-wider font-medium">
          {$t("dashboard.sessions")}
        </p>
      </div>
    </div>
  </section>

  <!-- CTA Button - Floating Style -->
  <section class="max-w-lg mx-auto mb-10 px-1">
    <a 
      href="/timer" 
      class="w-full h-16 text-lg font-semibold rounded-2xl shadow-xl shadow-sage/30 hover:shadow-2xl hover:shadow-sage/40 transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-sage to-sage/90 text-white flex items-center justify-center gap-3"
    >
      <span class="text-2xl">🧘‍♀️</span>
      {$t("dashboard.startTimer")}
    </a>
  </section>

  <!-- Achievements Section - Horizontal Scroll -->
  <section 
    class="max-w-lg mx-auto mb-8"
    class:opacity-0={!showAchievements}
    class:translate-y-4={!showAchievements}
    style="transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;"
  >
    <div class="flex items-center justify-between mb-4 px-1">
      <div>
        <h2 class="text-lg font-bold text-slate">{$t("badges.title")}</h2>
        <p class="text-xs text-slate/50">
          {unlockedCount}/{achievements.length} {$t("badges.unlocked")}
        </p>
      </div>
      {#if nextBadge}
        <div class="text-right">
          <p class="text-[10px] text-slate/40 uppercase tracking-wider">{$t("badges.next")}</p>
          <p class="text-sm font-medium text-sage">{$t(`badges.${nextBadge.id}.name`)}</p>
        </div>
      {/if}
    </div>

    <!-- Horizontal scrollable badges -->
    <div class="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      <div class="flex gap-3" style="width: max-content;">
        {#each achievements as badge}
          {@const remaining = Math.max(0, badge.threshold - badge.current)}
          <div 
            class="relative w-[140px] flex-shrink-0 rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02]
              {badge.achieved 
                ? 'bg-gradient-to-br from-sage/10 to-sage/5 border-sage/20 shadow-md' 
                : 'bg-white border-earth/10 opacity-70'}"
          >
            <div class="p-4 text-center">
              <div 
                class="w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-3xl
                  {badge.achieved ? 'bg-sage/20' : 'bg-earth/10 grayscale'}"
              >
                {badge.icon}
              </div>
              <p class="text-xs font-semibold text-slate truncate mb-1">
                {$t(`badges.${badge.id}.name`)}
              </p>
              
              {#if badge.achieved}
                <span class="inline-flex items-center gap-1 text-[10px] text-sage font-medium">
                  <span class="w-1.5 h-1.5 bg-sage rounded-full"></span>
                  {$t("badges.unlocked")}
                </span>
              {:else}
                <div class="space-y-1">
                  <div class="h-1 bg-earth/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-earth/40 transition-all"
                      style="width: {Math.min(100, Math.round(badge.progress * 100))}%"
                    ></div>
                  </div>
                  <p class="text-[10px] text-slate/40">
                    {remaining} {badge.type === "streak" ? $t("badges.days") : badge.type === "time" ? $t("badges.minutes") : $t("badges.sessions")} {$t("badges.toGo")}
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Calendar Section - Clean Design -->
  <section 
    class="max-w-lg mx-auto mb-8 px-1"
    class:opacity-0={!showCalendar}
    class:translate-y-4={!showCalendar}
    style="transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;"
  >
    <div class="bg-white rounded-3xl border border-earth/10 shadow-sm overflow-hidden">
      <!-- Calendar Header -->
      <div class="flex justify-between items-center p-4 border-b border-earth/5">
        <h2 class="text-lg font-bold text-slate">{$t("stats.history")}</h2>
        <div class="flex items-center gap-2">
          <button
            class="w-8 h-8 rounded-full hover:bg-earth/10 flex items-center justify-center text-slate/60 hover:text-slate transition-colors"
            on:click={() => changeMonth(-1)}
            aria-label={$locale === 'th' ? 'เดือนก่อนหน้า' : 'Previous month'}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="font-semibold text-sm text-sage min-w-[120px] text-center">
            {currentDate.toLocaleString($locale === "th" ? "th-TH" : "en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            class="w-8 h-8 rounded-full hover:bg-earth/10 flex items-center justify-center text-slate/60 hover:text-slate transition-colors"
            on:click={() => changeMonth(1)}
            aria-label={$locale === 'th' ? 'เดือนถัดไป' : 'Next month'}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="p-4">
        <!-- Day headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each $locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["S", "M", "T", "W", "T", "F", "S"] as day}
            <div class="text-center text-[10px] font-medium text-slate/40 py-1">
              {day}
            </div>
          {/each}
        </div>

        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as day}
            {#if day}
              {@const dateStr = formatDate(day)}
              {@const minutes = data.dailyMinutes[dateStr] || 0}
              {@const intensity = Math.min(1, minutes / 60)}
              {@const isToday = dateStr === todayStr}

              <div
                class="aspect-square rounded-lg flex flex-col items-center justify-center relative group cursor-default transition-all duration-200 hover:scale-110
                  {isToday ? 'ring-2 ring-sage ring-offset-1' : ''}
                  {minutes > 0 ? 'bg-sage text-white' : 'bg-earth/5 text-slate/40 hover:bg-earth/10'}"
                style="opacity: {minutes > 0 ? 0.4 + intensity * 0.6 : 1}"
              >
                <span class="text-xs font-medium">{day.getDate()}</span>
                {#if minutes > 0}
                  <span class="text-[8px] opacity-80">{minutes}</span>
                {/if}

                <!-- Tooltip -->
                <div
                  class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none transition-opacity shadow-lg"
                >
                  <div class="font-medium">
                    {new Date(dateStr).toLocaleDateString($locale === "th" ? "th-TH" : "en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div class="text-white/70">
                    {minutes > 0 ? `${minutes} ${$t("stats.minutes")}` : ($locale === 'th' ? 'ไม่มีข้อมูล' : 'No activity')}
                  </div>
                </div>
              </div>
            {:else}
              <div class="aspect-square"></div>
            {/if}
          {/each}
        </div>

        <!-- Legend -->
        <div class="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate/50">
          <span>{$t("stats.less")}</span>
          <div class="flex gap-0.5">
            <div class="w-3 h-3 rounded bg-earth/10"></div>
            <div class="w-3 h-3 rounded bg-sage/40"></div>
            <div class="w-3 h-3 rounded bg-sage/60"></div>
            <div class="w-3 h-3 rounded bg-sage/80"></div>
            <div class="w-3 h-3 rounded bg-sage"></div>
          </div>
          <span>{$t("stats.more")}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Session Types - Mini Cards -->
  {#if Object.keys(data.typeDistribution).length > 0}
    <section class="max-w-lg mx-auto mb-8 px-1">
      <h2 class="text-lg font-bold text-slate mb-3">{$t("stats.meditationTypes")}</h2>
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {#each Object.entries(data.typeDistribution) as [type, count]}
          <div class="flex-shrink-0 bg-white rounded-xl border border-earth/10 px-4 py-3 shadow-sm">
            <p class="text-sm font-semibold text-slate">{type}</p>
            <p class="text-xs text-slate/50">{count} {$t("stats.sessions")}</p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Recent History - Compact List -->
  <section class="max-w-lg mx-auto px-1 pb-8">
    <h2 class="text-lg font-bold text-slate mb-3">{$t("dashboard.recentHistory")}</h2>
    {#if data.recentSessions.length === 0}
      <div class="text-center py-12 text-slate/40">
        <div class="text-4xl mb-2">🧘</div>
        <p class="text-sm">{$t("dashboard.noSessions")}</p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each data.recentSessions as session}
          <div
            class="bg-white p-3 rounded-xl border border-earth/10 flex items-center gap-3 group hover:border-sage/20 transition-all"
          >
            <!-- Session type icon -->
            <div class="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center text-lg flex-shrink-0">
              {#if session.sessionType === 'Focus'}📍
              {:else if session.sessionType === 'Breathing'}🌬️
              {:else if session.sessionType === 'Sleep'}😴
              {:else}🧘{/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate truncate">{session.sessionType}</p>
              <p class="text-[10px] text-slate/40">
                {session.completedAt
                  ? new Date(session.completedAt).toLocaleDateString($locale === "th" ? "th-TH" : "en-US", {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : ""}
              </p>
            </div>

            <div class="flex items-center gap-2">
              {#if session.moodRating}
                <span class="text-lg" title="Mood: {session.moodRating}/5">
                  {["", "😫", "😕", "😐", "🙂", "😊"][session.moodRating]}
                </span>
              {/if}
              <span class="font-mono font-bold text-sage text-sm min-w-[3rem] text-right">
                {session.durationMinutes}m
              </span>
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
                  class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                  title={$t("dashboard.delete")}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
