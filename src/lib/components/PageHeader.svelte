<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    subtitle,
    children,
    class: className = "",
  }: {
    title: string;
    subtitle?: string;
    children?: Snippet;
    class?: string;
  } = $props();
</script>

<header class="mb-6 flex items-end justify-between gap-3 {className}">
  <div class="min-w-0">
    <h1 class="text-2xl font-bold text-foreground">{title}</h1>
    {#if subtitle}
      <p class="mt-0.5 text-sm text-foreground/60">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex flex-shrink-0 items-center gap-2">
      {@render children()}
    </div>
  {/if}
</header>
