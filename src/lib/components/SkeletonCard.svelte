<script lang="ts">
  let { lines = 3, class: className = "" }: { lines?: number; class?: string } =
    $props();

  const widths = ["w-1/3", "w-2/3", "w-1/2", "w-3/4", "w-2/5"];
</script>

<div
  class="space-y-3 rounded-2xl border border-border/20 bg-card p-4 {className}"
  aria-hidden="true"
>
  {#each Array(lines) as _, i}
    <div class="h-3 animate-pulse rounded-full bg-foreground/10 {widths[i % widths.length]}"></div>
  {/each}
</div>
