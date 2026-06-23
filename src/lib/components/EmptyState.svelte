<script lang="ts">
  type Action = { label: string; href?: string; onclick?: () => void };

  let {
    icon = "🌿",
    title,
    subtitle,
    action,
  }: {
    icon?: string;
    title: string;
    subtitle?: string;
    action?: Action;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
  <div class="mb-4 animate-float text-5xl">{icon}</div>
  <h3 class="mb-1 text-lg font-semibold text-foreground">{title}</h3>
  {#if subtitle}
    <p class="max-w-xs text-sm text-foreground/60">{subtitle}</p>
  {/if}
  {#if action}
    {#if action.href}
      <a
        href={action.href}
        onclick={action.onclick}
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5
               text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
      >
        {action.label}
      </a>
    {:else}
      <button
        type="button"
        onclick={action.onclick}
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5
               text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
      >
        {action.label}
      </button>
    {/if}
  {/if}
</div>
