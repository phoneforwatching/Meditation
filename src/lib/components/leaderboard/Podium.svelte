<script lang="ts">
    import { t } from "$lib/i18n";
    import { getTreeStage } from "$lib/tree";
    import { scale, fly } from "svelte/transition";

    interface User {
        id: number | string;
        displayName: string | null;
        avatarUrl: string | null;
        totalMinutes: number | null;
    }

    export let users: User[] = [];
    export let currentUserId: number | string | null = null;

    // reorder for display: 2, 1, 3
    $: displayUsers = [
        users[1] ? { ...users[1], rank: 2 as const } : null,
        users[0] ? { ...users[0], rank: 1 as const } : null,
        users[2] ? { ...users[2], rank: 3 as const } : null,
    ];

    const RANK_COLORS: Record<1 | 2 | 3, string> = {
        1: "from-yellow-300 via-amber-400 to-yellow-500 ring-amber-400 text-amber-700",
        2: "from-slate-200 via-slate-300 to-slate-400 ring-slate-300 text-slate-700",
        3: "from-amber-700 via-orange-800 to-amber-900 ring-orange-800 text-orange-900",
    };
</script>

<div class="flex justify-center items-end gap-2 sm:gap-4 mb-10 pt-16 px-2">
    {#each displayUsers as user, i}
        {#if user}
            {@const isMe = user.id === currentUserId}
            {@const stage = getTreeStage(user.totalMinutes || 0)}
            {@const isFirst = user.rank === 1}

            <!-- Card Container -->
            <a
                href="/profile/{user.id}"
                class="relative flex flex-col items-center group w-1/3 max-w-[140px]"
                in:fly={{ y: 50, duration: 600, delay: i * 150 }}
            >
                <!-- Crown/Badge for #1 -->
                {#if isFirst}
                    <div
                        class="absolute -top-12 z-30 text-4xl animate-bounce-short drop-shadow-lg"
                    >
                        👑
                    </div>
                {/if}

                <!-- Avatar Section -->
                <div class="relative mb-3">
                    <!-- Rank Badge -->
                    <div
                        class="absolute -bottom-2 -right-1 z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg bg-gradient-to-br {RANK_COLORS[
                            user.rank
                        ].split(' ')[0]} border-2 border-white text-sm"
                    >
                        {user.rank}
                    </div>

                    <!-- Avatar Image -->
                    <div
                        class="rounded-full p-1 bg-gradient-to-br {RANK_COLORS[
                            user.rank
                        ].split(' ')[0]} shadow-xl {isFirst
                            ? 'w-24 h-24 sm:w-28 sm:h-28'
                            : 'w-20 h-20 sm:w-24 sm:h-24'}"
                    >
                        {#if user.avatarUrl}
                            <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                class="w-full h-full rounded-full object-cover border-4 border-white bg-white"
                            />
                        {:else}
                            <div
                                class="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-white text-slate-400"
                            >
                                {(user.displayName || "A")[0].toUpperCase()}
                            </div>
                        {/if}
                    </div>

                    {#if isMe}
                        <div
                            class="absolute -top-2 -left-2 bg-sage text-white text-[10px] px-2 py-0.5 rounded-full shadow-md font-bold animate-pulse"
                        >
                            YOU
                        </div>
                    {/if}
                </div>

                <!-- Info Section -->
                <div class="text-center w-full relative z-10 space-y-1">
                    <div
                        class="font-bold text-slate truncate w-full px-1 text-sm sm:text-base"
                    >
                        {user.displayName || "Anonymous"}
                    </div>

                    <div
                        class="flex items-center justify-center gap-1 text-xs text-slate/60 bg-white/50 backdrop-blur-sm rounded-full py-0.5 px-2 mx-auto w-fit shadow-sm border border-white/40"
                    >
                        <span>{stage.symbol}</span>
                        <span class="max-w-[80px] truncate"
                            >{$t(`tree.${stage.id}.name`)}</span
                        >
                    </div>

                    <div class="pt-1">
                        <span
                            class="font-bold text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-br {RANK_COLORS[
                                user.rank
                            ].split(' ')[0]}"
                        >
                            {user.totalMinutes}
                        </span>
                        <span
                            class="text-[10px] text-slate/40 uppercase block -mt-1"
                        >
                            {$t("leaderboard.minutes")}
                        </span>
                    </div>
                </div>

                <!-- Podium Base Visual -->
                <div
                    class="absolute bottom-4 left-0 right-0 h-24 bg-gradient-to-t from-white/80 to-transparent -z-10 rounded-t-3xl opacity-50 blur-xl pointer-events-none"
                    style="transform: scale({isFirst ? 1.5 : 1});"
                ></div>
            </a>
        {:else}
            <!-- Placeholder for empty spot -->
            <div class="w-1/3 max-w-[120px]"></div>
        {/if}
    {/each}
</div>
