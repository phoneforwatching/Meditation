<script lang="ts">
  let {
    icon = "🧘",
    title,
    subtitle,
    badge,
    href,
    onclick,
  }: {
    icon?: string;
    title: string;
    subtitle: string;
    badge?: string;
    href?: string;
    onclick?: () => void;
  } = $props();
</script>

<svelte:element
  this={href ? "a" : "button"}
  {href}
  {onclick}
  type={href ? undefined : "button"}
  role={href ? undefined : "button"}
  class="group flex w-full items-center gap-4 rounded-xl border border-border/30 bg-card p-4 text-left
         transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
>
  <div
    class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl
           transition-colors duration-200 group-hover:bg-primary/15"
  >
    {icon}
  </div>
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-semibold text-foreground">{title}</p>
    <p class="mt-0.5 text-xs text-foreground/50">{subtitle}</p>
  </div>
  {#if badge}
    <span
      class="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 text-2xs font-semibold text-primary"
    >
      {badge}
    </span>
  {/if}
</svelte:element>
