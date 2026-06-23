<script lang="ts">
  import { cn } from "$lib/utils";

  type Trend = { direction: "up" | "down" | "neutral"; text: string };

  let {
    icon,
    label,
    value,
    meta,
    trend,
    class: className = "",
  }: {
    icon: string;
    label: string;
    value: string | number;
    meta?: string;
    trend?: Trend;
    class?: string;
  } = $props();

  const trendArrow = { up: "↑", down: "↓", neutral: "→" } as const;
  const trendColor = {
    up: "text-emerald-500",
    down: "text-red-400",
    neutral: "text-foreground/40",
  } as const;
</script>

<article
  class={cn(
    "rounded-2xl border border-border/30 bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm",
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
    className,
  )}
>
  <div class="mb-3 text-2xl leading-none">{icon}</div>
  <p class="mb-1 text-2xs font-medium uppercase tracking-wide text-foreground/50">
    {label}
  </p>
  <p class="text-xl font-bold text-foreground">{value}</p>
  {#if meta}
    <p class="mt-0.5 text-2xs text-foreground/40">{meta}</p>
  {/if}
  {#if trend}
    <div class="mt-2 flex items-center gap-1">
      <span class={cn("text-2xs font-medium", trendColor[trend.direction])}>
        {trendArrow[trend.direction]} {trend.text}
      </span>
    </div>
  {/if}
</article>
