<script lang="ts">
  import { cn } from "$lib/utils";
  import { ChevronDown } from "@lucide/svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  type Option = { value: string; label: string };

  type Props = HTMLSelectAttributes & {
    label?: string;
    error?: string;
    hint?: string;
    options?: Option[];
    class?: string;
    value?: string | null;
  };

  let {
    label,
    error,
    hint,
    options = [],
    class: className = "",
    id,
    value = $bindable(),
    ...props
  }: Props = $props();

  const fallbackId = $props.id();
  const selectId = $derived(id ?? `select-${fallbackId}`);
  const describedBy = $derived(
    error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined,
  );
</script>

<div class={cn("space-y-1.5", className)}>
  {#if label}
    <label for={selectId} class="block text-sm font-medium text-foreground/80">
      {label}
    </label>
  {/if}
  <div class="relative">
    <select
      id={selectId}
      bind:value
      aria-invalid={error ? "true" : undefined}
      aria-describedby={describedBy}
      {...props}
      class={cn(
        "w-full appearance-none rounded-xl border bg-card px-4 py-2.5 pr-10",
        "text-sm text-foreground transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60",
        error ? "border-destructive/60" : "border-border/40 hover:border-border/70",
      )}
    >
      {#each options as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <ChevronDown
      class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
    />
  </div>
  {#if error}
    <p id="{selectId}-error" class="text-2xs text-destructive">{error}</p>
  {:else if hint}
    <p id="{selectId}-hint" class="text-2xs text-foreground/50">{hint}</p>
  {/if}
</div>
