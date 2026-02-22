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

  const MAX_NOTIFICATIONS = 20;
  let unreadMessageCount = 0;
  let unreadNotificationCount = 0;
  let notifications: any[] = [];
  let showNotifications = false;
  let subscription: RealtimeChannel | null = null;

  let hasUnread = false;
  let unreadPopupDismissed = false;

  $: if ($page.data.unreadMessageCount !== undefined) {
    unreadMessageCount = $page.data.unreadMessageCount;
  }
  $: if ($page.data.unreadNotificationCount !== undefined) {
    unreadNotificationCount = $page.data.unreadNotificationCount;
  }
  $: if ($page.data.notifications) {
    notifications = $page.data.notifications;
  }
  $: hasUnread =
    unreadNotificationCount > 0 || notifications.some((n) => !n.isRead);

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

  const SPLASH_STEPS = {
    en: ["Inhale", "Hold", "Exhale"],
    th: ["หายใจเข้า", "กลั้นไว้", "หายใจออก"],
  } as const;

  let showLaunchScreen = true;
  let launchScreenExiting = false;
  let launchStepLabel = "";
  let launchTimers: Array<ReturnType<typeof setTimeout>> = [];

  $: launchSubtitle =
    $locale === "th"
      ? "กำลังเตรียมพื้นที่สงบของคุณ"
      : "Preparing your calm space";

  function clearLaunchTimers() {
    for (const timer of launchTimers) {
      clearTimeout(timer);
    }
    launchTimers = [];
  }

  function startLaunchSequence() {
    const steps = $locale === "th" ? SPLASH_STEPS.th : SPLASH_STEPS.en;
    clearLaunchTimers();
    launchScreenExiting = false;
    showLaunchScreen = true;
    launchStepLabel = steps[0];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      launchTimers.push(
        setTimeout(() => {
          showLaunchScreen = false;
        }, 120),
      );
      return;
    }

    launchTimers.push(
      setTimeout(() => {
        launchStepLabel = steps[1];
      }, 680),
      setTimeout(() => {
        launchStepLabel = steps[2];
      }, 1320),
      setTimeout(() => {
        launchScreenExiting = true;
      }, 1920),
      setTimeout(() => {
        showLaunchScreen = false;
      }, 2480),
    );
  }

  onMount(() => {
    startLaunchSequence();

    // Subscribe to Supabase Realtime
    const userId = $page.data.user?.id;
    if (!userId) return;

    subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          notifications = [payload.new, ...notifications].slice(
            0,
            MAX_NOTIFICATIONS,
          );
          unreadNotificationCount += 1;
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          updateUnreadCount();
        },
      )
      .subscribe();
  });

  onDestroy(() => {
    clearLaunchTimers();
    if (subscription) supabase.removeChannel(subscription);
  });

  async function markRead(id: number) {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    if (unreadNotificationCount > 0) {
      unreadNotificationCount = Math.max(0, unreadNotificationCount - 1);
    }
  }

  async function handleBellClick() {
    showNotifications = !showNotifications;
    if (showNotifications && hasUnread) {
      const pendingUnread = unreadNotificationCount;
      unreadNotificationCount = 0;
      // Mark all as read on server
      try {
        await fetch("/api/notifications/read", { method: "POST" });
        // Update local state to reflect read status
        notifications = notifications.map((n) => ({ ...n, isRead: true }));
      } catch (e) {
        console.error("Failed to mark notifications as read", e);
        unreadNotificationCount = pendingUnread;
      }
    }
  }
</script>

{#if showLaunchScreen}
  <div
    class="launch-screen"
    class:launch-screen--exit={launchScreenExiting}
    aria-hidden="true"
  >
    <div class="launch-screen__backdrop"></div>
    <div class="launch-screen__mesh"></div>
    <div class="launch-screen__grain"></div>
    <div class="launch-screen__orb launch-screen__orb--one"></div>
    <div class="launch-screen__orb launch-screen__orb--two"></div>
    <div class="launch-screen__orb launch-screen__orb--three"></div>
    <div class="launch-screen__beam launch-screen__beam--left"></div>
    <div class="launch-screen__beam launch-screen__beam--right"></div>
    <div class="launch-screen__constellation">
      <span class="launch-screen__dot launch-screen__dot--1"></span>
      <span class="launch-screen__dot launch-screen__dot--2"></span>
      <span class="launch-screen__dot launch-screen__dot--3"></span>
      <span class="launch-screen__dot launch-screen__dot--4"></span>
      <span class="launch-screen__dot launch-screen__dot--5"></span>
      <span class="launch-screen__dot launch-screen__dot--6"></span>
    </div>

    <div class="launch-center">
      <div class="launch-center__halo"></div>
      <div class="launch-ring launch-ring--outer"></div>
      <div class="launch-ring launch-ring--middle"></div>
      <div class="launch-ring launch-ring--inner"></div>

      <div class="launch-emblem">
        <img
          src="/icon-192.png"
          alt=""
          class="launch-emblem__logo"
          width="88"
          height="88"
        />
      </div>

      <h1 class="launch-title">BREATHE</h1>
      <p class="launch-subtitle">{launchSubtitle}</p>

      <div class="launch-progress" role="presentation">
        <span class="launch-progress__bar"></span>
      </div>

      <p class="launch-phase">{launchStepLabel}</p>
    </div>
  </div>
{/if}

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
      : 'bg-cream/85 backdrop-blur-sm rounded-2xl mt-2 border border-earth/10'}"
  >
    <a
      href="/"
      class="font-bold text-xl flex items-center gap-2 transition-colors {!isDarkPage
        ? 'text-sage'
        : 'text-blue-200'}"
    >
      <img
        src="/icon-192.png"
        alt="Logo"
        class="w-8 h-8 object-contain rounded-lg"
      />
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

  <main
    class="p-4 max-w-4xl mx-auto space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
  >
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
      class="fixed bottom-0 left-0 right-0 border-t pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md z-50 transition-all duration-300 {!isDarkPage
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
