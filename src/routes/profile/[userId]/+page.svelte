<script lang="ts">
    import { t } from "$lib/i18n";
    import { getTreeStage } from "$lib/tree";
    import { fade } from "svelte/transition";

    export let data;
    const { profile, meditationStats, sleepStats } = data;
    const stage = getTreeStage(profile.totalMinutes);

    function formatDuration(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
</script>

<div class="min-h-[80vh] pb-24 max-w-2xl mx-auto w-full px-4 pt-8 space-y-8">
    <!-- Header -->
    <div class="text-center space-y-4">
        <div class="relative inline-block">
            {#if profile.avatarUrl}
                <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
            {:else}
                <div
                    class="w-32 h-32 rounded-full bg-sage/20 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg mx-auto"
                >
                    {(profile.displayName || "A")[0].toUpperCase()}
                </div>
            {/if}
            <div
                class="absolute -bottom-2 -right-2 text-4xl filter drop-shadow-md"
            >
                {stage.symbol}
            </div>
        </div>

        <div>
            <h1 class="text-3xl font-bold text-sage">
                {profile.displayName || "Anonymous"}
            </h1>
            <p class="text-slate/60 text-sm">
                {$t(`tree.${stage.id}.name`)} • {profile.totalMinutes}
                {$t("stats.minutes")}
            </p>
            {#if profile.bio}
                <p class="text-slate/80 mt-2 max-w-md mx-auto italic">
                    "{profile.bio}"
                </p>
            {/if}
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
        <!-- Meditation Stats -->
        <div
            class="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm space-y-2"
        >
            <h3 class="font-bold text-sage flex items-center gap-2">
                <span>🧘</span>
                {$t("profile.meditation")}
            </h3>
            <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-sage/10 rounded-xl p-2">
                    <div class="text-xl font-bold text-sage">
                        {meditationStats.totalSessions}
                    </div>
                    <div class="text-[10px] text-slate/60 uppercase">
                        {$t("stats.sessions")}
                    </div>
                </div>
                <div class="bg-sage/10 rounded-xl p-2">
                    <div class="text-xl font-bold text-sage">
                        {profile.totalMinutes}
                    </div>
                    <div class="text-[10px] text-slate/60 uppercase">
                        {$t("stats.minutes")}
                    </div>
                </div>
            </div>
        </div>

        <!-- Sleep Stats -->
        <div
            class="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm space-y-2"
        >
            <h3 class="font-bold text-blue-500 flex items-center gap-2">
                <span>🌙</span>
                {$t("profile.sleep")}
            </h3>
            <div class="grid grid-cols-2 gap-2 text-center">
                <div class="bg-blue-500/10 rounded-xl p-2">
                    <div class="text-xl font-bold text-blue-600">
                        {formatDuration(sleepStats.avgDuration)}
                    </div>
                    <div class="text-[10px] text-slate/60 uppercase">
                        {$t("sleep.avgSleep")}
                    </div>
                </div>
                <div class="bg-blue-500/10 rounded-xl p-2">
                    <div class="text-xl font-bold text-blue-600">
                        {sleepStats.avgQuality > 0
                            ? sleepStats.avgQuality.toFixed(1)
                            : "-"}
                    </div>
                    <div class="text-[10px] text-slate/60 uppercase">
                        {$t("sleep.quality")}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="space-y-4">
        <h3 class="font-bold text-slate text-lg px-2">
            {$t("profile.recentActivity")}
        </h3>
        <div
            class="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden divide-y divide-slate/5"
        >
            {#each meditationStats.recentSessions as session}
                <div
                    class="p-4 flex justify-between items-center hover:bg-white/60 transition-colors"
                >
                    <div class="flex items-center gap-3">
                        <div class="text-2xl">
                            {#if session.sessionType === "Sleep"}🌙
                            {:else}🧘{/if}
                        </div>
                        <div>
                            <div class="font-semibold text-slate text-sm">
                                {session.sessionType}
                            </div>
                            <div class="text-xs text-slate/50">
                                {new Date(
                                    session.createdAt,
                                ).toLocaleDateString()} • {new Date(
                                    session.createdAt,
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-sage">
                            {session.durationMinutes}m
                        </div>
                        {#if session.moodRating}
                            <div class="text-xs opacity-50">
                                Mood: {session.moodRating}/5
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
            {#if meditationStats.recentSessions.length === 0}
                <div class="p-8 text-center text-slate/40">
                    {$t("leaderboard.empty")}
                </div>
            {/if}
        </div>
    </div>
</div>
