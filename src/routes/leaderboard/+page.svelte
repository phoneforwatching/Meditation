<script lang="ts">
    import { t } from "$lib/i18n";
    import { getTreeStage } from "$lib/tree";
    import { fade } from "svelte/transition";
    import Podium from "$lib/components/leaderboard/Podium.svelte";

    export let data;

    type Tab = "weekly" | "alltime";
    let activeTab: Tab = "weekly";

    $: list = activeTab === "weekly" ? data.weekly : data.allTime;
    $: subtitle =
        activeTab === "weekly"
            ? $t("leaderboard.weeklySubtitle")
            : $t("leaderboard.subtitle");
</script>

<div class="min-h-[80vh] flex flex-col max-w-2xl mx-auto w-full px-4">
    <div class="text-center space-y-2 mb-6 pt-8">
        <h1 class="text-4xl font-bold text-sage">{$t("leaderboard.title")}</h1>
        <p class="text-slate/60 text-sm">{subtitle}</p>
    </div>

    <!-- Tab Switcher -->
    <div class="flex bg-white/60 backdrop-blur-sm rounded-2xl p-1 mb-4 border border-white/50 shadow-sm">
        <button
            class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 {activeTab === 'weekly'
                ? 'bg-sage text-white shadow-sm'
                : 'text-slate/60 hover:text-sage'}"
            on:click={() => (activeTab = "weekly")}
        >
            {$t("leaderboard.tabWeekly")}
        </button>
        <button
            class="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 {activeTab === 'alltime'
                ? 'bg-sage text-white shadow-sm'
                : 'text-slate/60 hover:text-sage'}"
            on:click={() => (activeTab = "alltime")}
        >
            {$t("leaderboard.tabAllTime")}
        </button>
    </div>

    {#key activeTab}
        <div
            class="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden"
            in:fade={{ duration: 200 }}
        >
            <!-- Top 3 Podium -->
            {#if list.length >= 1}
                <Podium
                    users={list.slice(0, 3)}
                    currentUserId={data.currentUserId}
                />
            {/if}

            <!-- Column Headers -->
            <div
                class="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-slate/10 text-sm font-bold text-slate/60 bg-white/50"
            >
                <div class="w-8 text-center">#</div>
                <div>{$t("leaderboard.user")}</div>
                <div class="text-right">{$t("leaderboard.time")}</div>
            </div>

            <!-- List (Rank 4+) -->
            <div class="divide-y divide-slate/5 bg-white/30">
                {#each list.slice(3) as user, i}
                    {@const actualRank = i + 4}
                    {@const isMe = user.id === data.currentUserId}
                    {@const stage = getTreeStage(user.totalMinutes ?? 0)}

                    <a
                        href="/profile/{user.id}"
                        class="grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center hover:bg-white/60 transition-colors {isMe
                            ? 'bg-sage/5'
                            : ''}"
                        in:fade={{ duration: 300, delay: Math.min(i * 40, 800) }}
                    >
                        <div class="w-8 text-center font-bold text-slate/40">
                            {actualRank}
                        </div>

                        <div class="flex items-center gap-3 overflow-hidden">
                            {#if user.avatarUrl}
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    class="w-10 h-10 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                                />
                            {:else}
                                <div
                                    class="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sm font-bold border border-white shadow-sm flex-shrink-0"
                                >
                                    {(user.displayName || "A")[0].toUpperCase()}
                                </div>
                            {/if}

                            <div class="min-w-0">
                                <div
                                    class="font-semibold text-slate truncate flex items-center gap-2"
                                >
                                    {user.displayName || "Anonymous"}
                                    {#if isMe}
                                        <span
                                            class="text-[10px] bg-sage text-white px-1.5 py-0.5 rounded-full"
                                            >YOU</span
                                        >
                                    {/if}
                                </div>
                                <div
                                    class="text-xs text-slate/50 flex items-center gap-1"
                                >
                                    <span>{stage.symbol}</span>
                                    <span>{$t(`tree.${stage.id}.name`)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="text-right">
                            <div class="font-bold text-sage">
                                {user.totalMinutes}
                            </div>
                            <div class="text-[10px] text-slate/40 uppercase">
                                {$t("leaderboard.minutes")}
                            </div>
                        </div>
                    </a>
                {/each}

                {#if list.length === 0}
                    <div class="p-10 text-center text-slate/40">
                        {$t("leaderboard.empty")}
                    </div>
                {/if}
            </div>
        </div>
    {/key}
</div>
