<script lang="ts">
  // Force rebuild
  import "../app.css";
  import { page } from "$app/stores";
  import { locale, t } from "$lib/i18n";
  import type { RealtimeChannel } from "@supabase/supabase-js";

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
  function getNavItemClass(path: string, isDark: boolean, currentPath: string) {
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
  import { supabase } from "$lib/supabaseClient";

  let unreadMessageCount = 0;
  let notifications: any[] = [];
  let showNotifications = false;
  let subscription: RealtimeChannel | null = null;

  let hasUnread = false;
  let unreadPopupDismissed = false;

  $: if ($page.data.unreadMessageCount !== undefined) {
    unreadMessageCount = $page.data.unreadMessageCount;
  }
  $: if ($page.data.notifications) {
    notifications = $page.data.notifications;
    // If we have notifications on load, show the badge
    // We could refine this to check if any are actually unread if we had that data
    // For now, just show it if there are any, or rely on a persistent "last read" timestamp
    // But per request "hide after click", we can just initialize to true if length > 0
    // However, this would reset on every navigation.
    // A better approach for "session" persistence is just local state, but it resets on reload.
    // Let's stick to the simple request: "after click, red button disappears".
    // We'll initialize hasUnread to true if there are notifications.
    // Check if there are any unread notifications
    if (notifications.some((n) => !n.isRead)) {
      hasUnread = true;
    }
  }

  async function updateUnreadCount() {
    if ($page.data.user) {
      // Fetch messages count
      try {
        const res = await fetch("/api/messages/unread");
        if (res.ok) {
          const data = await res.json();
          unreadMessageCount = data.count;
        }
      } catch (e) {
        console.error("Failed to fetch unread messages", e);
      }
      // Fetch notifications
      // For simplicity, we might just reload the page data or fetch a new endpoint
      // But here we can just invalidate the layout data
      // invalidateAll(); // This might be too heavy.
      // Ideally we have an API to fetch notifications.
    }
  }

  onMount(() => {
    // Subscribe to Supabase Realtime
    subscription = supabase
      .channel(`notifications:${$page.data.user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${$page.data.user?.id}`,
        },
        (payload) => {
          notifications = [payload.new, ...notifications];
          hasUnread = true; // Show badge on new notification
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${$page.data.user?.id}`,
        },
        () => {
          updateUnreadCount();
        },
      )
      .subscribe();
  });

  onDestroy(() => {
    if (subscription) supabase.removeChannel(subscription);
  });

  async function markRead(id: number) {
    // Optimistic update
    notifications = notifications.filter((n) => n.id !== id);
    // Call API (we need an endpoint for this, or just rely on navigation)
    // For now, we assume clicking the link handles it or we add an endpoint later.
    // Actually, let's just create a simple server action or API if needed.
    // But for this step, let's just hide it.
  }

  async function handleBellClick() {
    showNotifications = !showNotifications;
    if (showNotifications && hasUnread) {
      hasUnread = false;
      // Mark all as read on server
      try {
        await fetch("/api/notifications/read", { method: "POST" });
        // Update local state to reflect read status
        notifications = notifications.map((n) => ({ ...n, isRead: true }));
      } catch (e) {
        console.error("Failed to mark notifications as read", e);
      }
    }
  }
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
      ? 'bg-[#0B1026]/80 backdrop-blur-sm rounded-2xl mt-2 border border-white/10'
      : ''}"
  >
    <a
      href="/"
      class="font-bold text-xl flex items-center gap-2 transition-colors {!isDarkPage
        ? 'text-sage'
        : 'text-blue-200'}"
    >
      <img src="/logo.png" alt="Logo" class="w-8 h-8 object-contain" />
      {$t("nav.tree")}
    </a>
    <div class="flex items-center gap-4">
      {#if $page.data.user && !isAuthPage}
        <!-- Notification Bell -->
        <div class="relative">
          <button
            class="text-xl hover:scale-110 transition-transform relative"
            on:click={handleBellClick}
          >
            🔔
            {#if notifications.length > 0 && hasUnread}
              <span
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              ></span>
            {/if}
          </button>

          {#if showNotifications}
            <div
              class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-earth/10 overflow-hidden z-50"
            >
              <div class="p-3 border-b border-earth/10 bg-cream/50">
                <h3 class="font-bold text-slate text-sm">Notifications</h3>
              </div>
              <div class="max-h-96 overflow-y-auto">
                {#if notifications.length === 0}
                  <div class="p-4 text-center text-slate/50 text-sm">
                    No new notifications
                  </div>
                {:else}
                  {#each notifications as note}
                    <a
                      href={note.link}
                      class="block p-3 hover:bg-earth/5 transition-colors border-b border-earth/5 last:border-0"
                      on:click={() => markRead(note.id)}
                    >
                      <div class="flex gap-3">
                        <div class="text-2xl">
                          {#if note.type === "message"}💬
                          {:else if note.type === "nudge"}👋
                          {:else}📢{/if}
                        </div>
                        <div>
                          <div class="font-semibold text-slate text-sm">
                            {note.title}
                          </div>
                          <div class="text-slate/60 text-xs">
                            {note.message}
                          </div>
                          <div class="text-slate/40 text-[10px] mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </a>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
        </div>

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
    {#if unreadMessageCount > 0 && $page.url.pathname !== "/chat" && !unreadPopupDismissed}
      <div
        class="bg-blue-100 border border-blue-200 text-slate p-4 rounded-xl flex justify-between items-center animate-bounce-short"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl">📩</span>
          <span>
            {$t("notifications.youHave")} <strong>{unreadMessageCount}</strong>
            {$t(
              unreadMessageCount > 1
                ? "notifications.unreadMessages"
                : "notifications.unreadMessage",
            )}!
          </span>
        </div>
        <a
          href="/chat"
          class="text-sm font-bold text-blue-500 hover:underline"
          on:click={() => (unreadPopupDismissed = true)}
        >
          {$t("notifications.view")}
        </a>
      </div>
    {/if}
    <slot />
  </main>

  <!-- Bottom Navigation Bar -->
  {#if $page.data.user && !isAuthPage}
    <nav
      class="fixed bottom-0 left-0 right-0 border-t shadow-lg backdrop-blur-md z-50 transition-all duration-300 {!isDarkPage
        ? 'bg-white/80 border-earth/20'
        : 'bg-[#0B1026]/90 border-white/10'}"
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
            class="relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/community',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">👥</span>
            <span class="text-xs font-medium">{$t("nav.community")}</span>
          </a>

          <!-- Leaderboard -->
          <a
            href="/leaderboard"
            class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/leaderboard',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">🏆</span>
            <span class="text-xs font-medium">{$t("nav.leaderboard")}</span>
          </a>

          <!-- Chat -->
          <a
            href="/chat"
            class="relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all {getNavItemClass(
              '/chat',
              isDarkPage,
              $page.url.pathname,
            )}"
          >
            <span class="text-2xl">💬</span>
            <span class="text-xs font-medium">{$t("nav.chat")}</span>
            {#if unreadMessageCount > 0}
              <span
                class="absolute -top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[1.25rem] text-center"
              >
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            {/if}
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
