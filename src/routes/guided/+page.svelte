<script lang="ts">
  import { fade } from "svelte/transition";
  import { locale, t } from "$lib/i18n";
  import { GUIDED_SESSIONS } from "$lib/guided";

  $: lang = ($locale === "th" ? "th" : "en") as "th" | "en";
</script>

<div class="max-w-lg mx-auto py-8 space-y-6" in:fade={{ duration: 300 }}>
  <div class="text-center space-y-2">
    <div
      class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage/10 mb-1"
    >
      <span class="text-3xl">🧭</span>
    </div>
    <h1 class="text-2xl font-bold text-slate">{$t("guided.title")}</h1>
    <p class="text-slate/60 text-sm">{$t("guided.subtitle")}</p>
  </div>

  <div class="space-y-3">
    {#each GUIDED_SESSIONS as s}
      <a
        href="/guided/{s.id}"
        class="block rounded-2xl border-2 bg-gradient-to-br {s.accent} p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
      >
        <div class="flex items-center gap-4">
          <span class="text-3xl">{s.emoji}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-slate truncate">{s.title[lang]}</h2>
              <span
                class="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate/70"
              >
                {s.durationMinutes} {$t("timer.minutes")}
              </span>
            </div>
            <p class="text-xs text-slate/60 mt-0.5 line-clamp-2">
              {s.subtitle[lang]}
            </p>
          </div>
          <span class="text-slate/30 text-xl shrink-0">→</span>
        </div>
      </a>
    {/each}
  </div>

  <p class="text-center text-xs text-slate/40">{$t("guided.hint")}</p>
</div>
