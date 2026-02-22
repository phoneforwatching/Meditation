<script lang="ts">
  import { locale, t } from "$lib/i18n";
  import type { PageData } from "./$types";

  export let data: PageData;

  let selectedType = data.filters.type;
  let startDate = data.filters.start;
  let endDate = data.filters.end;
  let minMinutes = data.filters.min;
  let maxMinutes = data.filters.max;

  function getSessionIcon(type: string) {
    if (type === "Focus") return "📍";
    if (type === "Breathing") return "🌬️";
    if (type === "Sleep") return "😴";
    if (type === "Mindfulness") return "🧘";
    if (type === "Loving-Kindness") return "💖";
    return "✨";
  }

  function getMoodEmoji(mood: number | null) {
    if (!mood) return "";
    return ["", "😫", "😕", "😐", "🙂", "😊"][mood] || "";
  }

  function formatSessionDate(value: Date | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(
      $locale === "th" ? "th-TH" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  }

  function formatSessionTime(value: Date | null) {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString(
      $locale === "th" ? "th-TH" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }
</script>

<section class="max-w-4xl mx-auto px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
  <div
    class="rounded-2xl border border-white/40 bg-gradient-to-br from-white via-cream to-white/90 p-4 shadow-xl sm:p-6"
  >
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate">{$t("history.title")}</h1>
        <p class="mt-1 text-sm text-slate/70">
          {#if data.hasActiveFilters}
            {$locale === "th"
              ? `แสดง ${data.sessions.length} จาก ${data.totalSessions} รายการ`
              : `Showing ${data.sessions.length} of ${data.totalSessions} sessions`}
          {:else}
            {$locale === "th"
              ? `ทั้งหมด ${data.totalSessions} รายการ`
              : `${data.totalSessions} sessions`}
          {/if}
        </p>
      </div>
      <a
        href="/"
        class="inline-flex min-h-11 items-center gap-1 rounded-lg bg-sage/10 px-3 py-2 text-sm font-semibold text-sage transition-colors hover:bg-sage/15"
      >
        {$t("history.back")}
      </a>
    </div>

    <form
      method="GET"
      class="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-sage/20 bg-sage/5 p-3 sm:grid-cols-2 lg:grid-cols-6"
    >
      <label class="flex flex-col gap-1 lg:col-span-2">
        <span class="text-xs font-semibold text-slate/70">{$t("history.type")}</span>
        <select
          name="type"
          bind:value={selectedType}
          class="min-h-11 rounded-lg border border-slate/20 bg-white px-3 text-sm text-slate focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
        >
          <option value="all">{$t("history.allTypes")}</option>
          {#each data.sessionTypes as sessionType}
            <option value={sessionType}>{sessionType}</option>
          {/each}
        </select>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-slate/70">{$t("history.from")}</span>
        <input
          type="date"
          name="start"
          bind:value={startDate}
          class="min-h-11 rounded-lg border border-slate/20 bg-white px-3 text-sm text-slate focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-slate/70">{$t("history.to")}</span>
        <input
          type="date"
          name="end"
          bind:value={endDate}
          class="min-h-11 rounded-lg border border-slate/20 bg-white px-3 text-sm text-slate focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-slate/70">{$t("history.minMinutes")}</span>
        <input
          type="number"
          min="1"
          name="min"
          bind:value={minMinutes}
          placeholder="0"
          class="min-h-11 rounded-lg border border-slate/20 bg-white px-3 text-sm text-slate focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-semibold text-slate/70">{$t("history.maxMinutes")}</span>
        <input
          type="number"
          min="1"
          name="max"
          bind:value={maxMinutes}
          placeholder="999"
          class="min-h-11 rounded-lg border border-slate/20 bg-white px-3 text-sm text-slate focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
        />
      </label>

      <div class="flex gap-2 sm:col-span-2 lg:col-span-6">
        <button
          type="submit"
          class="inline-flex min-h-11 items-center justify-center rounded-lg bg-sage px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-sage/90"
        >
          {$t("history.apply")}
        </button>
        <a
          href="/history"
          class="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate/20 bg-white px-4 py-2 text-sm font-semibold text-slate transition-colors hover:bg-slate-50"
        >
          {$t("history.clear")}
        </a>
      </div>
    </form>

    {#if data.sessions.length === 0}
      <div class="rounded-xl border border-earth/20 bg-white/70 px-4 py-10 text-center">
        <p class="text-slate/70">{$t("history.empty")}</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.sessions as session}
          <article
            class="rounded-xl border border-white/40 bg-gradient-to-r from-white via-cream to-white/60 p-4"
          >
            <div class="mb-2 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-slate sm:text-base">
                  {getSessionIcon(session.sessionType)} {session.sessionType}
                </p>
                <p class="mt-1 text-xs text-slate/70">
                  {formatSessionDate(session.completedAt)}
                  {" • "}
                  {formatSessionTime(session.completedAt)}
                </p>
              </div>
              <span
                class="shrink-0 rounded-lg bg-sage/10 px-3 py-1 text-sm font-bold text-sage"
              >
                {session.durationMinutes}m
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-xs text-slate/80">
              {#if session.moodRating}
                <span class="rounded-full bg-white/80 px-2.5 py-1">
                  {$t("history.mood")} {getMoodEmoji(session.moodRating)}
                </span>
              {/if}
              {#if session.notes}
                <span class="max-w-full truncate rounded-full bg-white/80 px-2.5 py-1">
                  {$t("history.note")}: {session.notes}
                </span>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>
