<script>
  import "../app.css";
  import { page } from "$app/stores";
  import { locale, t } from "$lib/i18n";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function toggleLanguage() {
    locale.update((l) => (l === "en" ? "th" : "en"));
  }

  // Determine if current page needs dark theme (for sleep page)
  $: isDarkPage = $page.url.pathname === "/sleep";
  $: isAuthPage =
    $page.url.pathname === "/login" || $page.url.pathname === "/signup";

  // Helper function for navigation item classes
  function getNavItemClass(path, isDark, currentPath) {
    const isActive = currentPath === path;
    if (!isDark) {
      // Light theme
      return isActive
        ? "text-sage bg-sage/10"
        : "text-slate/60 hover:text-sage";
    } else {
      // Dark theme
      return isActive
        ? "text-blue-200 bg-blue-400/20"
        : "text-blue-300/50 hover:text-blue-200";
    }
  }

  import { onMount, onDestroy } from "svelte";

  let unreadMessageCount = 0;
  let pollInterval;

  $: if ($page.data.unreadMessageCount !== undefined) {
    unreadMessageCount = $page.data.unreadMessageCount;
  }

  onMount(() => {
    pollInterval = setInterval(async () => {
      if ($page.data.user) {
        try {
          const res = await fetch("/api/messages/unread");
          if (res.ok) {
            const data = await res.json();
            unreadMessageCount = data.count;
          }
        } catch (e) {
          console.error("Failed to poll unread messages", e);
        }
      }
    }, 10000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
</script>

<div
  class="min-h-screen font-sans transition-colors duration-300"
  class:bg-cream={!isDarkPage}
  class:text-slate={!isDarkPage}
  class:bg-[#0B1026]={isDarkPage}
  class:text-blue-50={isDarkPage}
>
  <!-- Top Nav - Changes color based on page -->
  <nav
    class="p-4 flex justify-between items-center max-w-4xl mx-auto transition-colors duration-300 {isDarkPage
      ? 'bg-slate-900/50 backdrop-blur-sm rounded-2xl mt-2'
      : ''}"
  >
    <a
      href="/"
      class="font-bold text-xl flex items-center gap-2 transition-colors {!isDarkPage
        ? 'text-sage'
        : 'text-blue-200'}"
    >
      <span>🌳</span>
      {$t("nav.tree")}
    </a>
    <div class="flex items-center gap-4">
      <button
        on:click={toggleLanguage}
        class="text-xl hover:scale-110 transition-transform"
        title="Switch Language"
      >
        {$locale === "en" ? "🇹🇭" : "🇬🇧"}
      </button>

      {#if $page.data.user && !isAuthPage}
        <a
          href="/settings/profile"
          class="text-xl hover:scale-110 transition-transform"
          title="Profile Settings"
        >
          👤
        </a>
        <button
          on:click={logout}
          class="text-sm font-semibold transition-colors {!isDarkPage
            ? 'text-slate/60 hover:text-sage'
            : 'text-blue-200/60 hover:text-blue-100'}"
        >
          {$t("nav.logout")}
        </button>
      {/if}
    </div>
  </nav>

  <main class="p-4 max-w-4xl mx-auto space-y-4 pb-24">
    {#if unreadMessageCount > 0 && $page.url.pathname !== "/chat"}
      <div
        class="bg-blue-100 border border-blue-200 text-slate p-4 rounded-xl flex justify-between items-center animate-bounce-short"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl">💬</span>
          <span>
            You have <strong>{unreadMessageCount}</strong> unread message{unreadMessageCount >
            1
              ? "s"
              : ""}!
          </span>
        </div>
        <a href="/chat" class="text-sm font-bold text-blue-500 hover:underline">
          View
        </a>
      </div>
    {/if}
    {#if $page.data.nudges && $page.data.nudges.length > 0}
      <div
        class="bg-peach/20 border border-peach text-slate p-4 rounded-xl flex justify-between items-center animate-bounce-short"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl">👋</span>
          <span>
            <strong>{$page.data.nudges[0].senderName}</strong>
            {#if $page.data.nudges.length > 1}
              and {$page.data.nudges.length - 1} others
            {/if}
            nudged you to meditate!
          </span>
        </div>
        <button
          class="text-sm font-bold text-sage hover:underline"
          on:click={async () => {
            await fetch("/api/nudge/read", { method: "POST" });
            window.location.reload();
          }}
        >
          Got it
        </button>
      </div>
    {/if}
    <slot />
  </main>

  <!-- Bottom Navigation Bar -->
  {#if $page.data.user && !isAuthPage}
    <nav
      class="fixed bottom-0 left-0 right-0 border-t shadow-lg backdrop-blur-md z-50 transition-all duration-300 {!isDarkPage
        ? 'bg-white/80 border-earth/20'
        : 'bg-slate-900/80 border-white/10'}"
    >
      <div class="max-w-4xl mx-auto px-4 py-2">
        <div class="flex justify-around items-center">
          <!-- Home -->
          <a
            href="/"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl"
              >{$page.url.pathname === "/" ? "🌳" : "🌱"}</span
            >
            <span class="text-xs font-medium">{$t("nav.tree")}</span>
          </a>

          <!-- Timer -->
          <a
            href="/timer"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/timer',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">⏱️</span>
            <span class="text-xs font-medium">{$t("dashboard.meditate")}</span>
          </a>

          <!-- Community -->
          <a
            href="/community"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/community',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">👥</span>
            <span class="text-xs font-medium">{$t("nav.community")}</span>
            {#if unreadMessageCount > 0}
              <span
                class="absolute top-2 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              ></span>
            {/if}
          </a>

          <!-- Sleep -->
          <a
            href="/sleep"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/sleep',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">🌙</span>
            <span class="text-xs font-medium">{$t("nav.sleep")}</span>
          </a>

          <!-- Stats -->
          <a
            href="/stats"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/stats',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">📊</span>
            <span class="text-xs font-medium">{$t("nav.stats")}</span>
          </a>
        </div>
      </div>
    </nav>
  {/if}
</div>

<style>
  @keyframes bounce-short {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  .animate-bounce-short {
    animation: bounce-short 2s infinite;
  }
</style>
