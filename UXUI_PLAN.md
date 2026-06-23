# BREATHE — UX/UI Refactor Plan

> SvelteKit 2 · Svelte 5 · Tailwind CSS v4 · bits-ui  
> Based on: codebase audit (June 2026) + heylinda-app reference patterns  
> Status: Ready to implement

---

## 0. Context & Findings

### Stack ที่มีอยู่
- **Framework:** SvelteKit 2 + Svelte 5 (runes)
- **Styling:** Tailwind CSS v4 + custom CSS vars (`--sage`, `--earth`, `--cream`, `--peach`, `--slate`)
- **Components:** bits-ui (Button, Card, Badge, Dialog, Tabs, Avatar, Progress, Slider)
- **Icons:** @lucide/svelte
- **Animation:** 65+ custom keyframes ใน `src/app.css` (มีครบ แต่ใช้ไม่ครบทุก page)
- **DB/Auth:** Supabase + Drizzle ORM + PostgreSQL

### Routes ทั้งหมด (14 routes)

| Route | Page | Auth |
|---|---|---|
| `/` | Dashboard — Tree, stats, calendar, recent sessions | ✅ |
| `/timer` | Meditation timer (setup → running → done) | ✅ |
| `/history` | Session history with filters | ✅ |
| `/insights` | Analytics — mood trends, streaks, insights | ✅ |
| `/log` | Manual meditation logging | ✅ |
| `/community` | Social feed + ambient sounds | ✅ |
| `/leaderboard` | Global rankings + podium | ✅ |
| `/chat` | Conversation list | ✅ |
| `/chat/[userId]` | Chat thread | ✅ |
| `/profile/[userId]` | User profile | ✅ |
| `/settings/profile` | Profile settings | ✅ |
| `/sleep` | Sleep tracking + firefly viz | ✅ |
| `/login` `/signup` | Auth pages | ❌ |

### ปัญหาหลักที่ audit พบ

| # | ปัญหา | Severity | Affected Files |
|---|---|---|---|
| 1 | ไม่มี unified Input component — 3 styles ต่างกัน | 🔴 Critical | Log, History, Settings, Sleep |
| 2 | Button ผสม `<Button>` กับ raw `<button>` Tailwind | 🔴 Critical | Timer, Log, History, Dashboard |
| 3 | Repeated card patterns 5 แบบ ไม่ extracted | 🟠 High | Dashboard, Insights, Sleep |
| 4 | Animation gap: History, Chat, Community, Leaderboard list | 🟠 High | 4 pages |
| 5 | Dark mode ผูกกับ `/sleep` route เท่านั้น (`isDarkPage = pathname === "/sleep"`) | 🟡 Medium | `+layout.svelte:19` |
| 6 | Launch screen 2480ms hardcoded ไม่ skip ได้ | 🟡 Medium | `+layout.svelte:134` |
| 7 | Typography fragmented — 10+ custom sizes (`text-[10px]`, `text-[11px]`, clamp, etc.) | 🟡 Medium | Global |
| 8 | ไม่มี skeleton loaders — data pages โล่งระหว่างโหลด | 🟢 Low | History, Insights, Community |
| 9 | `MoodTrendChart` มี `min-w-[400px]` hardcoded — overflow บน mobile | 🟢 Low | `MoodTrendChart.svelte:70` |

---

## Phase 1 — Design System Foundation

> ไม่ต้องแตะ page ใด — แค่ config + shared tokens  
> ประมาณ 3–4 ชั่วโมง

### 1.1 Typography Scale — ⚠️ implemented in `app.css` (`@theme`), not `tailwind.config.js`

> **v4 note:** โปรเจกต์นี้เป็น **Tailwind CSS v4** (`@import "tailwindcss"` + `@tailwindcss/postcss`)
> และไม่มี `@config` directive → `tailwind.config.js` **ไม่ถูกโหลด**. theme tokens อยู่ใน
> `@theme inline` ใน `app.css`. เพราะฉะนั้น `text-2xs` / `text-display` / `--spacing-safe-bottom`
> ถูกเพิ่มใน `app.css` แทน (ค่าเริ่มต้น xs–9xl มากับ v4 อยู่แล้ว เลยเติมแค่หัวท้าย).

**ปัจจุบัน:** ไม่มี custom fontSize — ใช้ default Tailwind + `text-[10px]` scattered

**เพิ่ม:**

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        sage: '#4A7C59',
        earth: '#C4A484',
        cream: '#F9F7F2',
        slate: '#2C3E50',
        peach: '#E6B89C'
      },
      fontFamily: {
        sans: ['"Sukhumvit Set"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px — เดิมใช้ text-[10px]
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
        'base':['1rem',     { lineHeight: '1.5rem' }],
        'lg':  ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'display': ['clamp(2.1rem,6vw,3.25rem)', { lineHeight: '1.1', fontWeight: '800' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
```

**Migrate:** ค้นหา `text-\[10px\]` / `text-\[11px\]` / `text-\[12px\]` → replace ด้วย `text-2xs` / `text-xs`

---

### 1.2 Global CSS Variables เพิ่ม (`src/app.css`)

เพิ่มต่อจาก `:root` block เดิม (บรรทัดหลัง `--peach`):

```css
/* src/app.css — เพิ่มใน :root */
:root {
  /* ... existing vars ... */

  /* Transition timing */
  --ease-calm: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  /* Z-index scale */
  --z-nav: 40;
  --z-modal: 50;
  --z-toast: 60;
  --z-launch: 100;
}
```

---

### 1.3 Dark Mode Store (`src/lib/stores/theme.ts`)

**ปัจจุบัน:** `isDarkPage = $page.url.pathname === "/sleep"` ใน +layout.svelte:19  
**ปัญหา:** Dark mode ทำงานเฉพาะ `/sleep` เท่านั้น

```ts
// src/lib/stores/theme.ts  (ไฟล์ใหม่)
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

const getInitial = (): Theme => {
  if (!browser) return 'light';
  const stored = localStorage.getItem('breathe-theme') as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const theme = writable<Theme>(getInitial());

theme.subscribe((value) => {
  if (!browser) return;
  localStorage.setItem('breathe-theme', value);
  document.documentElement.classList.toggle('dark', value === 'dark');
});

export function toggleTheme() {
  theme.update(t => t === 'light' ? 'dark' : 'light');
}
```

**แก้ `+layout.svelte:19`:**

```svelte
<!-- ลบบรรทัดนี้ -->
$: isDarkPage = $page.url.pathname === "/sleep";

<!-- แทนด้วย -->
import { theme, toggleTheme } from '$lib/stores/theme';
onMount(() => {
  // force .dark class เมื่ออยู่ /sleep
  if ($page.url.pathname === '/sleep') theme.set('dark');
});
```

---

### 1.4 Launch Screen Skip (`src/routes/+layout.svelte:99–136`)

**ปัจจุบัน:** `setTimeout(() => { showLaunchScreen = false }, 2480)` — ไม่ skip ได้

**แก้ function `startLaunchSequence`:**

```ts
function skipLaunchScreen() {
  clearLaunchTimers();
  launchScreenExiting = true;
  launchTimers.push(setTimeout(() => { showLaunchScreen = false; }, 520));
}

// ใน startLaunchSequence เปลี่ยน timeout สุดท้าย:
launchTimers.push(
  setTimeout(() => { launchStepLabel = steps[1]; }, 680),
  setTimeout(() => { launchStepLabel = steps[2]; }, 1320),
  setTimeout(() => { launchScreenExiting = true; }, 1920),
  setTimeout(() => { showLaunchScreen = false; }, 2480),
);
```

**เพิ่ม `onclick` บน launch screen wrapper (หา div ที่ wrap ทั้ง launch screen):**

```svelte
{#if showLaunchScreen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div onclick={skipLaunchScreen} role="button" tabindex="0" aria-label="Skip intro"
       class="fixed inset-0 z-[var(--z-launch)] cursor-pointer ...">
    <!-- existing content -->
  </div>
{/if}
```

---

## Phase 2 — Component Library

> สร้างไฟล์ใหม่ใน `src/lib/components/` — ไม่แตะ page ใดก่อน  
> ประมาณ 5–6 ชั่วโมง

### 2.1 Input Component (`src/lib/components/ui/input/input.svelte`)

```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  
  let {
    label,
    error,
    hint,
    class: className = '',
    id,
    ...props
  }: {
    label?: string;
    error?: string;
    hint?: string;
    class?: string;
    id?: string;
    [key: string]: any;
  } = $props();

  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;
</script>

<div class={cn('space-y-1.5', className)}>
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-foreground/80">
      {label}
    </label>
  {/if}
  <input
    {id}={inputId}
    {...props}
    class={cn(
      'w-full rounded-xl border bg-card px-4 py-2.5 text-sm text-foreground',
      'placeholder:text-foreground/40 transition-all duration-[--duration-base]',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      error
        ? 'border-destructive/60 focus:ring-destructive/20'
        : 'border-border/40 hover:border-border/70'
    )}
  />
  {#if error}
    <p class="text-2xs text-destructive">{error}</p>
  {:else if hint}
    <p class="text-2xs text-foreground/50">{hint}</p>
  {/if}
</div>
```

**Migrate:** แทน input ใน Log (`+page.svelte`), History filters, Settings profile

---

### 2.2 Textarea Component (`src/lib/components/ui/textarea/textarea.svelte`)

```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  
  let { label, error, hint, class: className = '', rows = 3, ...props } = $props();
</script>

<div class={cn('space-y-1.5', className)}>
  {#if label}
    <label class="block text-sm font-medium text-foreground/80">{label}</label>
  {/if}
  <textarea
    {rows}
    {...props}
    class={cn(
      'w-full rounded-xl border bg-card px-4 py-3 text-sm text-foreground resize-none',
      'placeholder:text-foreground/40 transition-all duration-[--duration-base]',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
      error ? 'border-destructive/60' : 'border-border/40 hover:border-border/70'
    )}
  ></textarea>
  {#if error}<p class="text-2xs text-destructive">{error}</p>{/if}
  {#if hint && !error}<p class="text-2xs text-foreground/50">{hint}</p>{/if}
</div>
```

---

### 2.3 Select Component (`src/lib/components/ui/select/select.svelte`)

```svelte
<script lang="ts">
  import { cn } from '$lib/utils';
  
  let { label, error, options = [], class: className = '', ...props } = $props<{
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    class?: string;
    [key: string]: any;
  }>();
</script>

<div class={cn('space-y-1.5', className)}>
  {#if label}
    <label class="block text-sm font-medium text-foreground/80">{label}</label>
  {/if}
  <div class="relative">
    <select
      {...props}
      class={cn(
        'w-full appearance-none rounded-xl border bg-card px-4 py-2.5 pr-10',
        'text-sm text-foreground transition-all duration-[--duration-base]',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60',
        error ? 'border-destructive/60' : 'border-border/40'
      )}
    >
      {#each options as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
  </div>
  {#if error}<p class="text-2xs text-destructive">{error}</p>{/if}
</div>
```

---

### 2.4 StatCard Component (`src/lib/components/StatCard.svelte`)

> Replaces: Dashboard:516-540, Insights:96-171, Sleep:179-211 (3+ duplicated patterns)

```svelte
<script lang="ts">
  let {
    icon,
    label,
    value,
    meta,
    trend,
    class: className = '',
  }: {
    icon: string;
    label: string;
    value: string | number;
    meta?: string;
    trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
    class?: string;
  } = $props();
</script>

<article class="rounded-2xl border border-border/30 bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition-all duration-[--duration-base]
                {className}">
  <div class="mb-3 text-2xl leading-none">{icon}</div>
  <p class="text-2xs font-medium text-foreground/50 uppercase tracking-wide mb-1">{label}</p>
  <p class="text-xl font-bold text-foreground">{value}</p>
  {#if meta}
    <p class="text-2xs text-foreground/40 mt-0.5">{meta}</p>
  {/if}
  {#if trend}
    <div class="mt-2 flex items-center gap-1">
      <span class="text-2xs font-medium {trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-red-400' : 'text-foreground/40'}">
        {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
      </span>
    </div>
  {/if}
</article>
```

**Usage:**
```svelte
<StatCard icon="🔥" label="Current Streak" value="{streak} days" meta="Personal best: 14 days"
          trend={{ direction: 'up', text: '+2 from last week' }} />
```

---

### 2.5 SessionItem Component (`src/lib/components/SessionItem.svelte`)

> Replaces: Dashboard:1048-1140, History:175-218

```svelte
<script lang="ts">
  let {
    icon = '🧘',
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

  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  {href}
  {onclick}
  class="group w-full rounded-xl border border-border/30 bg-card p-4 flex items-center gap-4
         hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]
         transition-all duration-[--duration-base] text-left"
>
  <div class="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15
              flex items-center justify-center text-xl flex-shrink-0
              transition-colors duration-[--duration-base]">
    {icon}
  </div>
  <div class="flex-1 min-w-0">
    <p class="font-semibold text-sm text-foreground truncate">{title}</p>
    <p class="text-xs text-foreground/50 mt-0.5">{subtitle}</p>
  </div>
  {#if badge}
    <span class="text-2xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary flex-shrink-0">
      {badge}
    </span>
  {/if}
</svelte:element>
```

---

### 2.6 PageHeader Component (`src/lib/components/PageHeader.svelte`)

> ใช้แทน h1 + subtitle pattern ที่ซ้ำใน 7 pages

```svelte
<script lang="ts">
  let {
    title,
    subtitle,
    children,
    class: className = '',
  }: {
    title: string;
    subtitle?: string;
    children?: any;
    class?: string;
  } = $props();
</script>

<header class="flex items-end justify-between mb-6 {className}">
  <div>
    <h1 class="text-2xl font-bold text-foreground">{title}</h1>
    {#if subtitle}
      <p class="text-sm text-foreground/60 mt-0.5">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex items-center gap-2">
      {@render children()}
    </div>
  {/if}
</header>
```

---

### 2.7 SkeletonCard Component (`src/lib/components/SkeletonCard.svelte`)

```svelte
<script lang="ts">
  let { lines = 3, class: className = '' } = $props<{ lines?: number; class?: string }>();
  const widths = ['w-1/3', 'w-2/3', 'w-1/2', 'w-3/4', 'w-2/5'];
</script>

<div class="rounded-2xl border border-border/20 bg-card p-4 space-y-3 {className}">
  {#each Array(lines) as _, i}
    <div class="h-3 {widths[i % widths.length]} rounded-full bg-foreground/8 animate-shimmer"></div>
  {/each}
</div>
```

---

### 2.8 EmptyState Component (`src/lib/components/EmptyState.svelte`)

```svelte
<script lang="ts">
  let { icon = '🌿', title, subtitle, action } = $props<{
    icon?: string;
    title: string;
    subtitle?: string;
    action?: { label: string; href?: string; onclick?: () => void };
  }>();
</script>

<div class="flex flex-col items-center justify-center py-16 px-6 text-center">
  <div class="text-5xl mb-4 animate-float">{icon}</div>
  <h3 class="text-lg font-semibold text-foreground mb-1">{title}</h3>
  {#if subtitle}
    <p class="text-sm text-foreground/60 max-w-xs">{subtitle}</p>
  {/if}
  {#if action}
    <a href={action.href} onclick={action.onclick}
       class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5
              text-sm font-semibold text-primary-foreground hover:bg-primary/90
              transition-colors duration-[--duration-base]">
      {action.label}
    </a>
  {/if}
</div>
```

---

## Phase 3 — Animation Coverage

> ใช้ keyframes ที่มีอยู่แล้วใน app.css — แค่ apply ให้ครบ  
> ประมาณ 3–4 ชั่วโมง

### Animation Stagger Pattern

```svelte
<!-- ใช้ใน History, Community, Chat list items -->
{#each items as item, i}
  <div
    class="animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
    style="animation-delay: {i * 55}ms; animation-duration: 400ms"
  >
    <SessionItem {...item} />
  </div>
{/each}
```

### Page-by-page Animation Gaps

| Page | ที่ขาด | Solution |
|---|---|---|
| `/history` | List items ไม่ animate | stagger `animate-fade-in-up` บน session rows |
| `/community` | Posts ไม่ animate in | stagger `animate-fade-in` บน post cards |
| `/chat` | Message bubbles static | `animate-slide-in-right` / `animate-slide-in-left` |
| `/leaderboard` | Rank list ไม่ animate (podium ดีแล้ว) | stagger `animate-scale-in` บน rank rows |
| `/insights` | Stats cards ไม่ animate | stagger `animate-fade-in-up` บน StatCards |

### Transition เข้า/ออก Page (`+layout.svelte`)

เพิ่ม page transition ระหว่าง routes:

```svelte
<!-- src/routes/+layout.svelte — wrap เนื้อหาหลัก -->
{#key $page.url.pathname}
  <div class="animate-fade-in" style="animation-duration: 300ms">
    <slot />
  </div>
{/key}
```

---

## Phase 4 — Page-by-Page Fixes

> ประมาณ 6–8 ชั่วโมง

### 4.1 `/log` — ปัญหา Button + Input

**ปัญหา:** ใช้ `<button class="bg-sage text-white font-bold">` แทน `<Button>`  
**Fix:** Import และใช้ `<Button variant="default">` + Input component ทุก field

```svelte
<!-- ก่อน -->
<button class="w-full bg-sage text-white font-bold py-4 rounded-2xl">
  บันทึก
</button>

<!-- หลัง -->
<Button class="w-full h-14 rounded-2xl text-base font-semibold">
  บันทึก
</Button>
```

---

### 4.2 `/history` — Filter + Animation

**ปัญหา 1:** Filter inputs ใช้ inline style ต่างจาก page อื่น  
**Fix:** แทนด้วย `<Input>` / `<Select>` components

**ปัญหา 2:** Session list ไม่มี entrance animation  
**Fix:** ห่อด้วย stagger pattern (ดู Phase 3)

**ปัญหา 3:** Empty state ไม่มี (แสดงว่างๆ)  
**Fix:** เพิ่ม `<EmptyState>` เมื่อ `sessions.length === 0`

---

### 4.3 `/timer` — Button Consistency

**ปัญหา:** Timer มี `<Button size="lg" class="h-14">` — ผสม API กับ inline override  
**Fix:** เพิ่ม `size="xl"` variant ใน bits-ui button หรือ define class ที่ชัดเจน

---

### 4.4 `/insights` — Chart Mobile Fix

**ปัญหา:** `MoodTrendChart.svelte:70` มี `min-w-[400px]` — overflow บน mobile

**Fix ใน `src/lib/components/MoodTrendChart.svelte`:**

```svelte
<!-- ก่อน -->
<svg min-width="400" ...>

<!-- หลัง: ใช้ viewBox + preserveAspectRatio -->
<div class="w-full overflow-hidden">
  <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet" class="w-full">
    <!-- chart content -->
  </svg>
</div>
```

---

### 4.5 `/sleep` — Connect Dark Mode Store

**ปัญหา:** Sleep page ใช้ `.dark` class แต่ control ผ่าน `isDarkPage` ใน layout แทน store

**Fix `+layout.svelte`:**

```ts
// แทนที่ isDarkPage logic
import { theme } from '$lib/stores/theme';

$: if ($page.url.pathname === '/sleep') {
  theme.set('dark');
} else if ($page.url.pathname !== '/sleep' && $theme === 'dark') {
  // ไม่บังคับ reset — ให้ user control เอง
}
```

---

### 4.6 Navigation — Dark Mode Toggle

เพิ่ม toggle button ใน top nav (`+layout.svelte` nav section):

```svelte
<!-- เพิ่มใน top nav bar ระหว่าง notification bell กับ settings -->
<button onclick={toggleTheme} aria-label="Toggle theme"
        class="p-2 rounded-xl hover:bg-foreground/5 transition-colors">
  {#if $theme === 'dark'}
    <Sun class="w-5 h-5 text-foreground/70" />
  {:else}
    <Moon class="w-5 h-5 text-foreground/70" />
  {/if}
</button>
```

---

## Phase 5 — Polish & Accessibility

> ทำหลังสุด — ใช้เวลาประมาณ 4 ชั่วโมง

### 5.1 Skeleton Loading States

เพิ่มใน pages ที่ `{#await}` หรือ `{#if loading}`:

```svelte
<!-- History page — ระหว่างโหลด sessions -->
{#if loading}
  <div class="space-y-3">
    {#each Array(5) as _}
      <SkeletonCard lines={2} />
    {/each}
  </div>
{:else}
  <!-- sessions list -->
{/if}
```

---

### 5.2 Focus Visible Global

เพิ่มใน `app.css`:

```css
/* Focus rings สำหรับ keyboard nav */
:focus-visible {
  outline: 2px solid oklch(var(--primary));
  outline-offset: 2px;
}
```

---

### 5.3 Reduced Motion Respect

`app.css` มี `prefers-reduced-motion` บางส่วน — ทำให้ครบ:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## File Structure หลังเสร็จ

```
src/lib/
├── components/
│   ├── ui/
│   │   ├── button/          (bits-ui — ไม่แตะ)
│   │   ├── card/            (bits-ui — ไม่แตะ)
│   │   ├── input/
│   │   │   └── input.svelte         ✨ NEW
│   │   ├── textarea/
│   │   │   └── textarea.svelte      ✨ NEW
│   │   ├── select/
│   │   │   └── select.svelte        ✨ NEW
│   │   └── ...              (bits-ui rest)
│   ├── StatCard.svelte              ✨ NEW
│   ├── SessionItem.svelte           ✨ NEW
│   ├── PageHeader.svelte            ✨ NEW
│   ├── SkeletonCard.svelte          ✨ NEW
│   ├── EmptyState.svelte            ✨ NEW
│   ├── DailyReminder.svelte         (existing)
│   ├── HeatmapCalendar.svelte       (existing)
│   ├── MoodTrendChart.svelte        🔧 FIX mobile
│   ├── TimePicker.svelte            (existing)
│   └── leaderboard/
│       └── Podium.svelte            (existing)
├── stores/
│   └── theme.ts                     ✨ NEW
└── ...
```

---

## Implementation Order

### Week 1 — Foundation (ไม่ break existing pages)

```
✅ 1.1  app.css @theme — text-2xs / text-display / --font-mono / --spacing-safe-bottom
        (NOT tailwind.config.js — v4 ไม่โหลด JS config; ดู §1.1)
✅ 1.2  app.css :root — --ease-calm/--ease-spring, --duration-*, --z-* vars
✅ 1.3  src/lib/stores/theme.ts — dark mode store (route-aware, light-first default)
✅ 1.4  +layout.svelte — isDarkPage → theme store ($theme + applyRouteTheme)
✅ 1.5  +layout.svelte — skipLaunchScreen() + tap/Enter to skip
✅ 2.1  ui/input/input.svelte (bindable value, $props.id, a11y)
✅ 2.2  ui/textarea/textarea.svelte
✅ 2.3  ui/select/select.svelte
```

### Week 2 — Components + Migration

```
✅ 2.4  StatCard.svelte
✅ 2.5  SessionItem.svelte
✅ 2.6  PageHeader.svelte
✅ 2.7  SkeletonCard.svelte (animate-pulse — animate-shimmer ไม่เหมาะกับ bar ทึบ)
✅ 2.8  EmptyState.svelte
✅ 4.1  /log — migrate Button (size="xl") + Textarea
✅ 4.3  button.svelte — เพิ่ม size="xl" (h-14 rounded-2xl) ; /log ใช้แล้ว
✅ 4.4  MoodTrendChart — ลบ min-w-[400px]/overflow + preserveAspectRatio
```

### Week 3 — Animation + Polish

```
✅ 3.x  /history — stagger animate-fade-in-up + EmptyState + Input/Select filters
✅ 3.x  /community — activity feed entrance stagger (forest trees มี fly อยู่แล้ว)
✅ 3.x  /chat — message bubbles animate-slide-in-left/right
✅ 3.x  /leaderboard — มี in:fade stagger อยู่แล้ว (audit stale) ; แค่ migrate typography
✅ 3.x  +layout.svelte — page transition {#key $page.url.pathname}
✅ 4.5  /sleep — เชื่อม theme store (force dark, .dark class active ครั้งแรก)
⏭️ 4.6  nav — dark mode toggle: **ข้ามตามที่ตัดสินใจ** — non-sleep pages ใช้สีฮาร์ดโค้ด
        (bg-white/text-slate/bg-cream) + .dark remap --cream/--slate เป็นสีอ่อน →
        toggle จะทำให้ตัวอักษรมองไม่เห็น. store/กลไกพร้อมแล้วสำหรับ full dark pass ในอนาคต.
🔁 5.1  Skeleton loaders — SkeletonCard สร้างแล้ว; pages ทั้งหมดเป็น SSR (export let data)
        ไม่มี client loading state จริง → ไม่เพิ่ม dead code. ใช้เมื่อมี client fetch.
✅ 5.2  Focus visible global CSS — มีอยู่แล้ว; เปลี่ยนเป็น var(--primary) (ตาม theme)
✅ 5.3  prefers-reduced-motion global — มีอยู่แล้วใน app.css ครบ
```

---

## Status — 2026-06-23 (implemented)

ทุก phase เสร็จ ยกเว้น **4.6 (global dark toggle)** ที่ข้ามโดยตั้งใจ (ดูเหตุผลด้านบน) และ
**5.1 skeleton** ที่ยังไม่ apply เพราะ pages เป็น SSR ล้วน (component พร้อมใช้แล้ว).

**Verify:** `svelte-check` = 0 errors / 0 warnings · `npm run build` = ✓ built (Vercel adapter).

**ของใหม่ที่เกิดขึ้นจริง:**
- `src/lib/stores/theme.ts`
- `src/lib/components/ui/{input,textarea,select}/` (+ `index.ts`)
- `src/lib/components/{StatCard,SessionItem,PageHeader,SkeletonCard,EmptyState}.svelte`
- `app.css`: typography/spacing/timing/z-index tokens, launch-screen skip styles, focus ring → token
- `button.svelte`: `size="xl"`
- migrate `text-[10px]`/`text-[11px]` → `text-2xs` ทั้ง codebase (0 เหลือ)

---

## Design References

| Pattern | Source |
|---|---|
| Sage + Cream + Earth palette | existing `app.css` — ดีแล้ว, ไม่เปลี่ยน |
| Card elevation (shadow-soft, shadow-glow) | existing `app.css` |
| Breathing animation keyframes | existing `app.css:animate-breathe` |
| Minimal stats display | heylinda-app `Stats/index.tsx` |
| Session completion flow | heylinda-app `Completed/index.tsx` |
| Horizontal scroll categories | heylinda-app `Home/index.tsx` |
| Calendar heatmap | existing `HeatmapCalendar.svelte` |

---

*Last updated: 2026-06-23 · Audit by: deep-research + Explore agents*
