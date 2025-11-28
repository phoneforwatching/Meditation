<script lang="ts">
  import { enhance } from "$app/forms";

  import { page } from "$app/stores";

  let duration = Number($page.url.searchParams.get("duration")) || 10;
  let isAutoDuration = !!$page.url.searchParams.get("duration");
  let type = $page.url.searchParams.get("type") || "Breath";
  let mood = 3;

  const types = [
    "Breath",
    "Body Scan",
    "Loving Kindness",
    "Open Awareness",
    "Mantra",
    "Walking",
    "Other",
  ];
</script>

<div class="max-w-lg mx-auto py-8">
  <h1 class="text-2xl font-bold text-sage mb-6 text-center">Log Session</h1>

  <form
    method="POST"
    use:enhance
    class="bg-white p-8 rounded-2xl shadow-sm border border-earth/10 space-y-6"
  >
    <!-- Duration -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate" for="duration">
        Duration (minutes)
      </label>
      {#if isAutoDuration}
        <div class="text-3xl font-bold text-sage font-mono py-2">
          {duration}
          <span class="text-base font-normal text-slate/60">minutes</span>
        </div>
        <input type="hidden" name="duration" value={duration} />
        <p class="text-xs text-slate/60 italic">Recorded from actual session</p>
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
      <legend class="block text-sm font-medium text-slate">Type</legend>
      <div class="flex flex-wrap gap-2">
        {#each types as t}
          <button
            type="button"
            class="px-3 py-1 rounded-full text-sm border transition-colors {type ===
            t
              ? 'bg-sage text-white border-sage'
              : 'bg-white text-slate border-slate/20 hover:border-sage'}"
            on:click={() => (type = t)}
          >
            {t}
          </button>
        {/each}
        <input type="hidden" name="type" value={type} />
      </div>
    </fieldset>

    <!-- Mood -->
    <fieldset class="space-y-2">
      <legend class="block text-sm font-medium text-slate">Mood (After)</legend>
      <div class="flex justify-between px-2">
        {#each [1, 2, 3, 4, 5] as m}
          <button
            type="button"
            class="text-2xl transition-transform hover:scale-125 {mood === m
              ? 'scale-125 grayscale-0'
              : 'grayscale opacity-50'}"
            on:click={() => (mood = m)}
          >
            {["😫", "😕", "😐", "🙂", "😊"][m - 1]}
          </button>
        {/each}
        <input type="hidden" name="mood" value={mood} />
      </div>
    </fieldset>

    <!-- Notes -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate" for="notes">
        Notes (Optional)
      </label>
      <textarea
        id="notes"
        name="notes"
        rows="3"
        class="w-full rounded-lg border-slate/20 focus:border-sage focus:ring-sage"
        placeholder="How did it feel?"
      ></textarea>
    </div>

    <button
      type="submit"
      class="w-full bg-sage hover:bg-sage/90 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95"
    >
      Save Session
    </button>

    <div class="text-center">
      <a href="/" class="text-sm text-slate/50 hover:text-sage">Cancel</a>
    </div>
  </form>
</div>
