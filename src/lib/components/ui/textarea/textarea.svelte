<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLTextareaAttributes } from "svelte/elements";

  type Props = HTMLTextareaAttributes & {
    label?: string;
    error?: string;
    hint?: string;
    class?: string;
    value?: string | null;
  };

  let {
    label,
    error,
    hint,
    class: className = "",
    id,
    rows = 3,
    value = $bindable(),
    ...props
  }: Props = $props();

  const fallbackId = $props.id();
  const textareaId = $derived(id ?? `textarea-${fallbackId}`);
  const describedBy = $derived(
    error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined,
  );
</script>

<div class={cn("space-y-1.5", className)}>
  {#if label}
    <label for={textareaId} class="block text-sm font-medium text-foreground/80">
      {label}
    </label>
  {/if}
  <textarea
    id={textareaId}
    {rows}
    bind:value
    aria-invalid={error ? "true" : undefined}
    aria-describedby={describedBy}
    {...props}
    class={cn(
      "w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground resize-none",
      "placeholder:text-foreground/40 transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60",
      error ? "border-destructive/60" : "border-border/40 hover:border-border/70",
    )}
  ></textarea>
  {#if error}
    <p id="{textareaId}-error" class="text-2xs text-destructive">{error}</p>
  {:else if hint}
    <p id="{textareaId}-hint" class="text-2xs text-foreground/50">{hint}</p>
  {/if}
</div>
