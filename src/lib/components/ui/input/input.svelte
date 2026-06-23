<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLInputAttributes } from "svelte/elements";

  type Props = HTMLInputAttributes & {
    label?: string;
    error?: string;
    hint?: string;
    class?: string;
    value?: string | number | null;
  };

  let {
    label,
    error,
    hint,
    class: className = "",
    id,
    value = $bindable(),
    ...props
  }: Props = $props();

  const fallbackId = $props.id();
  const inputId = $derived(id ?? `input-${fallbackId}`);
  const describedBy = $derived(
    error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined,
  );
</script>

<div class={cn("space-y-1.5", className)}>
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-foreground/80">
      {label}
    </label>
  {/if}
  <input
    id={inputId}
    bind:value
    aria-invalid={error ? "true" : undefined}
    aria-describedby={describedBy}
    {...props}
    class={cn(
      "w-full rounded-xl border bg-card px-4 py-2.5 text-sm text-foreground",
      "placeholder:text-foreground/40 transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      error
        ? "border-destructive/60 focus:ring-destructive/20"
        : "border-border/40 hover:border-border/70",
    )}
  />
  {#if error}
    <p id="{inputId}-error" class="text-2xs text-destructive">{error}</p>
  {:else if hint}
    <p id="{inputId}-hint" class="text-2xs text-foreground/50">{hint}</p>
  {/if}
</div>
