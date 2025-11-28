<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { fade, fly } from "svelte/transition";
  import { t } from "$lib/i18n";
  export let data;

  // Podium heights for top 3
  const PODIUM_HEIGHTS = ["h-32", "h-24", "h-20"];
  const PODIUM_COLORS = [
    "bg-yellow-100 border-yellow-200",
    "bg-slate-100 border-slate-200",
    "bg-orange-100 border-orange-200",
  ];

  let nudgedUsers = new Set<number>();
</script>

<div class="min-h-[80vh] flex flex-col">
  <div class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold text-sage">{$t("community.title")}</h1>
    <p class="text-slate/60">{$t("community.subtitle")}</p>
  </div>

  <!-- Forest Scene Container -->
  <div
    class="flex-1 relative overflow-x-auto overflow-y-hidden pb-12 custom-scrollbar"
  >
    <!-- Sky/Background -->
    <div
      class="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-50/50 to-transparent -z-10"
    ></div>

    <!-- Ground Line -->
    <div
      class="absolute bottom-12 left-0 right-0 h-1 bg-earth/20 min-w-full w-max"
    ></div>

    <!-- Trees Container -->
    <div
      class="flex items-end px-12 gap-8 min-w-max h-full pt-20 pb-12 mx-auto"
    >
      {#each data.leaderboard as user, i}
        {@const stage = getTreeStage(user.totalMinutes)}
        {@const isTop3 = i < 3}
        {@const isMe = user.id === data.currentUserId}

        <div
          class="flex flex-col items-center relative group transition-all duration-300 hover:-translate-y-2"
          in:fly={{ y: 50, duration: 500, delay: i * 50 }}
        >
          <!-- Rank Badge (Floating) -->
          <div
            class="mb-4 font-bold text-slate/40 text-sm bg-white/80 px-2 py-1 rounded-full shadow-sm backdrop-blur-sm"
          >
            #{i + 1}
          </div>

          <!-- Tree -->
          <div
            class="relative z-10 text-center transform transition-transform group-hover:scale-110"
          >
            <div
              class="text-6xl filter drop-shadow-lg"
              style="font-size: {Math.max(
                3,
                Math.min(8, 3 + user.totalMinutes / 100),
              )}rem"
            >
              {stage.symbol}
            </div>

            <!-- Hover Stats Tooltip -->
            <div
              class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-slate text-xs px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-earth/10"
            >
              <div class="font-bold text-sage">
                {user.totalMinutes}
                {$t("stats.minutes")}
              </div>
              <div class="text-slate/60">{$t(`tree.${stage.id}.name`)}</div>
            </div>
          </div>

          <!-- Podium / Ground Connection -->
          {#if isTop3}
            <div
              class="{PODIUM_HEIGHTS[i]} w-24 {PODIUM_COLORS[
                i
              ]} border-t-4 border-x rounded-t-lg flex items-end justify-center pb-4 shadow-sm relative z-0 -mt-2"
            >
              <div class="text-3xl opacity-50">
                {["🥇", "🥈", "🥉"][i]}
              </div>
            </div>
          {:else}
            <div class="h-4 w-1 bg-earth/20 rounded-full -mt-2"></div>
          {/if}

          <!-- User Info -->
          <div class="mt-4 text-center space-y-1">
            <div
              class="font-semibold text-slate text-sm flex items-center justify-center gap-1 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm"
            >
              {user.displayName || "Anonymous"}
              {#if isMe}
                <span class="w-2 h-2 rounded-full bg-sage animate-pulse"></span>
              {/if}
            </div>

            <!-- Nudge Button -->
            {#if !isMe && !nudgedUsers.has(user.id)}
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity text-lg hover:scale-125 active:scale-95 p-1"
                title="{$t('community.nudge')} {user.displayName}"
                on:click={async (e) => {
                  const btn = e.currentTarget;
                  // Optimistic update
                  nudgedUsers.add(user.id);
                  nudgedUsers = nudgedUsers; // Trigger reactivity

                  import("$lib/haptics").then(({ vibrate, HAPTIC_PATTERNS }) =>
                    vibrate(HAPTIC_PATTERNS.TAP),
                  );

                  const res = await fetch("/api/nudge", {
                    method: "POST",
                    body: JSON.stringify({ receiverId: user.id }),
                    headers: { "Content-Type": "application/json" },
                  });

                  if (res.ok) {
                    import("$lib/haptics").then(
                      ({ vibrate, HAPTIC_PATTERNS }) =>
                        vibrate(HAPTIC_PATTERNS.SUCCESS),
                    );
                  } else {
                    // Revert on failure
                    nudgedUsers.delete(user.id);
                    nudgedUsers = nudgedUsers;

                    import("$lib/haptics").then(
                      ({ vibrate, HAPTIC_PATTERNS }) =>
                        vibrate(HAPTIC_PATTERNS.WARNING),
                    );
                    const d = await res.json();
                    alert(d.error);
                  }
                }}
              >
                👋
              </button>
            {/if}
          </div>
        </div>
      {/each}

      {#if data.leaderboard.length === 0}
        <div
          class="absolute inset-0 flex items-center justify-center text-slate/40 text-lg"
        >
          {$t("community.empty")}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
</style>
