<script lang="ts">
  import { t, locale } from "$lib/i18n";
  export let data;

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

    // Add empty slots for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
  }

  // Sort daily minutes by date
  $: sortedDaily = Object.entries(data.dailyMinutes).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  $: calendarDays = getDaysInMonth(currentDate);
  $: maxMinutes = Math.max(
    ...(Object.values(data.dailyMinutes) as number[]),
    1,
  );
</script>

<div class="max-w-2xl mx-auto space-y-8">
  <h1 class="text-3xl font-bold text-sage text-center">
    {$t("stats.progress")}
  </h1>

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

  <div class="text-center">
    <a href="/" class="text-sage hover:underline">{$t("stats.back")}</a>
  </div>
</div>
