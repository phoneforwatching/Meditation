<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { enhance } from "$app/forms";
  import { t, locale } from "$lib/i18n";

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
</script>

<div class="max-w-2xl mx-auto space-y-8">
  <!-- Hero Section -->
  <div class="text-center space-y-4 py-8">
    <!-- Tree Symbol with Glow -->
    <div class="relative inline-block">
      <div
        class="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-breathe"
      ></div>
      <div
        class="relative inline-block p-6 rounded-full bg-primary/10 border border-primary/20 shadow-soft"
      >
        <span class="text-7xl block animate-pulse-soft">{stage.symbol}</span>
      </div>
    </div>

    <h1 class="text-4xl font-bold text-primary">
      {$t(`tree.${stage.id}.name`)}
    </h1>
    <p class="text-muted-foreground max-w-md mx-auto">
      {$t(`tree.${stage.id}.desc`)}
    </p>

    {#if !isMaxStage}
      <div class="max-w-md mx-auto space-y-2 mt-4">
        <Progress value={progressPercent} class="h-3" />
        <p class="text-sm text-muted-foreground">
          <span class="font-semibold text-primary">{data.totalMinutes}</span> / {stage.maxMinutes +
            1}
          {$t("dashboard.untilNext")}
          <span class="font-medium">{$t(`tree.${nextStage.id}.name`)}</span>
        </p>
      </div>
    {:else}
      <Badge variant="default" class="mt-4 text-sm">
        🏆 {$t("dashboard.maxLevel")}
      </Badge>
    {/if}

    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-3 max-w-md mx-auto mt-8">
      <Card.Root class="glass shadow-soft border-border/50 overflow-hidden">
        <Card.Content class="p-4 text-center">
          <div class="text-2xl font-bold text-primary">{data.streak}</div>
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            🔥 {$t("dashboard.streak")}
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="glass shadow-soft border-border/50 overflow-hidden">
        <Card.Content class="p-4 text-center">
          <div class="text-2xl font-bold text-primary">{data.totalMinutes}</div>
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            ⏱️ {$t("dashboard.totalMinutes")}
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="glass shadow-soft border-border/50 overflow-hidden">
        <Card.Content class="p-4 text-center">
          <div class="text-2xl font-bold text-primary">
            {data.totalSessions}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wider">
            🧘 {$t("dashboard.sessions")}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Actions -->
  <div class="grid grid-cols-1 gap-4 max-w-md mx-auto">
    <Button
      asChild
      size="lg"
      class="h-14 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <a href="/timer" class="flex items-center gap-2">
        <span>⏱️</span>
        {$t("dashboard.startTimer")}
      </a>
    </Button>
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
          {unlockedCount} / {achievements.length}
          {$t("badges.unlocked")}
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
          {data.totalMinutes}
          {$t("dashboard.totalMinutes")}
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
            class="absolute inset-0 {badge.achieved
              ? 'bg-gradient-to-br from-sage/10 via-transparent to-cream/70'
              : 'bg-earth/5'}"
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
                  class="h-full {badge.achieved
                    ? 'bg-sage'
                    : 'bg-earth'} transition-all"
                  style="width: {Math.min(
                    100,
                    Math.round(badge.progress * 100),
                  )}%"
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
                      : $t("badges.sessions")}
                  {$t("badges.toGo")}
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Calendar -->
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-earth/10">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-slate">{$t("stats.history")}</h2>
      <div class="flex items-center gap-4">
        <button
          class="p-2 hover:bg-earth/10 rounded-full text-slate transition-colors"
          on:click={() => changeMonth(-1)}
        >
          ←
        </button>
        <span class="font-semibold text-lg text-sage w-32 text-center">
          {currentDate.toLocaleString($locale === "th" ? "th-TH" : "en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          class="p-2 hover:bg-earth/10 rounded-full text-slate transition-colors"
          on:click={() => changeMonth(1)}
        >
          →
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-2 mb-2">
      {#each $locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
        <div
          class="text-center text-xs font-medium text-slate/40 uppercase tracking-wider py-2"
        >
          {day}
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-7 gap-2">
      {#each calendarDays as day}
        {#if day}
          {@const dateStr = formatDate(day)}
          {@const minutes = data.dailyMinutes[dateStr] || 0}
          {@const intensity = Math.min(1, minutes / 60)}
          <!-- Cap intensity at 60 mins -->

          <div
            class="aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-all hover:scale-105
              {minutes > 0
              ? 'bg-sage text-white shadow-sm'
              : 'bg-earth/5 text-slate/40'}"
            style="opacity: {minutes > 0 ? 0.4 + intensity * 0.6 : 1}"
            title="{dateStr}: {minutes} {$t('stats.minutes')}"
          >
            <span class="text-sm font-medium">{day.getDate()}</span>
            {#if minutes > 0}
              <span class="text-[10px] opacity-80">{minutes}m</span>
            {/if}

            <!-- Tooltip -->
            <div
              class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity"
            >
              {new Date(dateStr).toLocaleDateString(
                $locale === "th" ? "th-TH" : "en-US",
                {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                },
              )}
              <br />
              <span class="font-bold">{minutes} {$t("stats.minutes")}</span>
            </div>
          </div>
        {:else}
          <div class="aspect-square"></div>
        {/if}
      {/each}
    </div>

    <div class="mt-6 flex items-center justify-end gap-2 text-xs text-slate/60">
      <span>{$t("stats.less")}</span>
      <div class="flex gap-1">
        <div class="w-4 h-4 rounded bg-sage/40"></div>
        <div class="w-4 h-4 rounded bg-sage/60"></div>
        <div class="w-4 h-4 rounded bg-sage/80"></div>
        <div class="w-4 h-4 rounded bg-sage"></div>
      </div>
      <span>{$t("stats.more")}</span>
    </div>
  </div>

  <!-- Type Distribution -->
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-earth/10">
    <h2 class="text-xl font-bold text-slate mb-4">
      {$t("stats.meditationTypes")}
    </h2>
    <div class="space-y-3">
      {#each Object.entries(data.typeDistribution) as [type, count]}
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-slate">{type}</span>
            <span class="text-slate/60">{count} {$t("stats.sessions")}</span>
          </div>
          <div class="w-full bg-earth/10 rounded-full h-2">
            <div
              class="bg-earth h-full rounded-full"
              style="width: {(count / data.totalSessions) * 100}%"
            ></div>
          </div>
        </div>
      {/each}
    </div>
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
