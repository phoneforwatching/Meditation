<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { t } from "$lib/i18n";

  $: durationParam = $page.url.searchParams.get("duration");
  $: isAutoDuration = !!durationParam;
  $: typeParam = $page.url.searchParams.get("type");

  let duration = 10;
  let type = "Breath";
  let mood = 3;
  let selectedTags: string[] = [];
  let loading = false;

  $: if (durationParam) {
    duration = Number(durationParam);
  }

  $: if (typeParam) {
    type = typeParam;
  }

  const types = [
    "Breath",
    "Body Scan",
    "Loving Kindness",
    "Open Awareness",
    "Mantra",
    "Walking",
    "Other",
  ];

  const moods = [1, 2, 3, 4, 5] as const;
  const moodEmojis = ["", "\u{1F62B}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"];

  const tagOptions = [
    "grateful",
    "calm",
    "anxious",
    "focused",
    "tired",
    "energetic",
    "peaceful",
    "restless",
  ];

  const tagEmojis: Record<string, string> = {
    grateful: "\u{1F64F}",
    calm: "\u{1F33F}",
    anxious: "\u{1F4AD}",
    focused: "\u{1F3AF}",
    tired: "\u{1F634}",
    energetic: "\u{26A1}",
    peaceful: "\u{1F54A}\uFE0F",
    restless: "\u{1F300}",
  };

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  }
</script>

<div class="max-w-lg mx-auto py-8">
  <h1 class="text-2xl font-bold text-sage mb-6 text-center">
    {$t("log.title")}
  </h1>

  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update();
        loading = false;
      };
    }}
    class="bg-white p-6 rounded-2xl shadow-sm border border-earth/10 space-y-6"
  >
    <!-- Duration -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate" for="duration">
        {$t("log.duration")}
      </label>
      {#if isAutoDuration}
        <div class="text-3xl font-bold text-sage font-mono py-2">
          {duration}
          <span class="text-base font-normal text-slate/60"
            >{$t("log.minutes")}</span
          >
        </div>
        <input type="hidden" name="duration" value={duration} />
        <p class="text-xs text-slate/60 italic">{$t("log.recorded")}</p>
      {:else}
        <div class="flex items-center gap-4">
          <input
            id="duration"
            type="range"
            min="1"
            max="999"
            bind:value={duration}
            class="w-full accent-sage"
            name="duration"
          />
          <span class="font-mono text-xl font-bold text-sage w-12 text-right"
            >{duration}</span
          >
        </div>
      {/if}
    </div>

    <!-- Type -->
    <fieldset class="space-y-2">
      <legend class="block text-sm font-medium text-slate"
        >{$t("log.type")}</legend
      >
      <div class="flex flex-wrap gap-2">
        {#each types as typeOption}
          <button
            type="button"
            class="px-3 py-1 rounded-full text-sm border transition-colors {type ===
            typeOption
              ? 'bg-sage text-white border-sage'
              : 'bg-white text-slate border-slate/20 hover:border-sage'}"
            on:click={() => (type = typeOption)}
          >
            {$t(`log.types.${typeOption}`)}
          </button>
        {/each}
        <input type="hidden" name="type" value={type} />
      </div>
    </fieldset>

    <!-- Mood -->
    <fieldset class="space-y-3">
      <legend class="block text-sm font-medium text-slate">
        {$t("log.howDoYouFeel")}
      </legend>
      <div class="flex justify-between gap-2">
        {#each moods as m}
          <button
            type="button"
            class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 {mood === m
              ? 'bg-sage/10 ring-2 ring-sage scale-105'
              : 'hover:bg-earth/5 opacity-50'}"
            on:click={() => (mood = m)}
          >
            <span class="text-3xl">{moodEmojis[m]}</span>
            <span class="text-[10px] font-medium text-slate/70">
              {$t(`log.moodLabels.${m}`)}
            </span>
          </button>
        {/each}
      </div>
      <input type="hidden" name="mood" value={mood} />
    </fieldset>

    <!-- Tags -->
    <fieldset class="space-y-2">
      <legend class="block text-sm font-medium text-slate">
        {$t("log.tags")}
      </legend>
      <p class="text-xs text-slate/50">{$t("log.tagsHint")}</p>
      <div class="flex flex-wrap gap-2">
        {#each tagOptions as tag}
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 {selectedTags.includes(tag)
              ? 'bg-sage/15 text-sage border-sage/30 font-medium'
              : 'bg-white text-slate/60 border-slate/20 hover:border-sage/30'}"
            on:click={() => toggleTag(tag)}
          >
            <span class="text-sm">{tagEmojis[tag]}</span>
            {$t(`log.tag.${tag}`)}
          </button>
        {/each}
      </div>
      <input type="hidden" name="tags" value={selectedTags.join(",")} />
    </fieldset>

    <!-- Notes -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate" for="notes">
        {$t("log.notes")}
      </label>
      <textarea
        id="notes"
        name="notes"
        rows="3"
        class="w-full rounded-lg border-slate/20 focus:border-sage focus:ring-sage"
        placeholder={$t("log.reflectPrompt")}
      ></textarea>
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-sage hover:bg-sage/90 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? $t("log.saving") : $t("log.save")}
    </button>

    <div class="text-center">
      <a href="/" class="text-sm text-slate/50 hover:text-sage"
        >{$t("log.cancel")}</a
      >
    </div>
  </form>
</div>
