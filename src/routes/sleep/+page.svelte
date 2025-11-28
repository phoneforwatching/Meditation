<script lang="ts">
    import { enhance } from "$app/forms";
    import { fade, fly } from "svelte/transition";
    import { t, locale } from "$lib/i18n";
    import { getSleepTreeStage } from "$lib/tree";
    export let data;

    let logging = false;

    $: sleepTreeStage = getSleepTreeStage(data.totalSleepMinutes);

    // Calendar Logic
    let currentDate = new Date();

    function changeMonth(delta: number) {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + delta,
            1,
        );
    }

    function getDaysInMonth(date: Date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++)
            days.push(new Date(year, month, i));
        return days;
    }

    $: calendarDays = getDaysInMonth(currentDate);

    // Map logs to date string for easy lookup
    $: logsByDate = data.recentLogs.reduce((acc: any, log: any) => {
        const dateStr = new Date(log.bedtime).toISOString().split("T")[0];
        acc[dateStr] = log;
        return acc;
    }, {});

    // Calculate total fireflies based on recent sleep quality
    $: fireflyCount = data.recentLogs.reduce(
        (acc: any, log: any) => acc + (log.quality || 0),
        0,
    );

    // Generate random positions for fireflies
    $: fireflies = Array.from({ length: Math.min(50, fireflyCount * 2) }).map(
        () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 2 + Math.random() * 3,
        }),
    );

    function formatTime(date: Date) {
        return new Date(date).toLocaleTimeString(
            $locale === "th" ? "th-TH" : "en-US",
            {
                hour: "2-digit",
                minute: "2-digit",
            },
        );
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString(
            $locale === "th" ? "th-TH" : "en-US",
            {
                weekday: "short",
                month: "short",
                day: "numeric",
            },
        );
    }

    // Default times for form
    function getLocalISOString(date: Date) {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 8 * 60 * 60 * 1000);

    let defaultWakeTime = getLocalISOString(now);
    let defaultBedtime = getLocalISOString(yesterday);
</script>

<div
    class="min-h-screen bg-[#0B1026] text-blue-50 -mx-4 -my-4 p-4 relative overflow-hidden"
>
    <!-- Stars -->
    <div class="absolute inset-0 z-0 opacity-50">
        {#each Array(50) as _, i}
            <div
                class="absolute bg-white rounded-full animate-pulse"
                style="
          top: {Math.random() * 100}%;
          left: {Math.random() * 100}%;
          width: {Math.random() * 2 + 1}px;
          height: {Math.random() * 2 + 1}px;
          animation-delay: {Math.random() * 5}s;
        "
            ></div>
        {/each}
    </div>

    <div class="relative z-10 max-w-md mx-auto space-y-8 pt-8 pb-20">
        <!-- Header -->
        <div class="text-center space-y-2">
            <h1 class="text-3xl font-bold text-blue-200 drop-shadow-lg">
                {$t("sleep.title")}
            </h1>
            <p class="text-blue-200/60">{$t("sleep.subtitle")}</p>
        </div>

        <!-- Tree & Fireflies Scene -->
        <div class="relative h-64 flex items-end justify-center">
            <!-- Silhouette Tree -->
            <div class="flex flex-col items-center z-10">
                <div class="text-9xl filter drop-shadow-2xl opacity-80 transition-all duration-1000 transform hover:scale-110 cursor-help" title={sleepTreeStage.description}>
                    {sleepTreeStage.symbol.replace('💤', '')}
                </div>
                <div class="mt-2 text-sm font-medium text-blue-200/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    {sleepTreeStage.name}
                </div>
            </div>

            <!-- Fireflies -->
            {#each fireflies as fly}
                <div
                    class="absolute w-2 h-2 bg-yellow-200 rounded-full blur-[1px] shadow-[0_0_8px_2px_rgba(255,255,0,0.6)] animate-float"
                    style="
            left: {fly.x}%;
            bottom: {fly.y}%;
            animation-duration: {fly.duration}s;
            animation-delay: {fly.delay}s;
          "
                ></div>
            {/each}
        </div>

        <!-- Stats Summary -->
        <div class="grid grid-cols-2 gap-4">
            <div
                class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"
            >
                <div class="text-2xl font-bold text-yellow-200">
                    {fireflyCount}
                </div>
                <div class="text-xs text-blue-200/60">
                    {$t("sleep.fireflies")}
                </div>
            </div>
            <div
                class="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10"
            >
                <div class="text-2xl font-bold text-blue-200">
                    {data.recentLogs.length > 0
                        ? Math.round(
                              (data.recentLogs.reduce(
                                  (acc: number, l: any) =>
                                      acc + l.durationMinutes,
                                  0,
                              ) /
                                  data.recentLogs.length /
                                  60) *
                                  10,
                          ) / 10
                        : 0}h
                </div>
                <div class="text-xs text-blue-200/60">
                    {$t("sleep.avgSleep")}
                </div>
            </div>
        </div>

        <!-- Sleep Calendar -->
        <div
            class="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl"
        >
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold flex items-center gap-2">
                    <span>📅</span>
                    {$t("sleep.calendar")}
                </h2>
                <div class="flex items-center gap-4">
                    <button
                        class="p-2 hover:bg-white/10 rounded-full transition-colors"
                        on:click={() => changeMonth(-1)}>←</button
                    >
                    <span class="font-semibold text-lg w-32 text-center">
                        {currentDate.toLocaleString(
                            $locale === "th" ? "th-TH" : "en-US",
                            {
                                month: "long",
                                year: "numeric",
                            },
                        )}
                    </span>
                    <button
                        class="p-2 hover:bg-white/10 rounded-full transition-colors"
                        on:click={() => changeMonth(1)}>→</button
                    >
                </div>
            </div>

            <div class="grid grid-cols-7 gap-2 mb-2">
                {#each $locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
                    <div
                        class="text-center text-xs font-medium text-blue-200/40 uppercase tracking-wider py-2"
                    >
                        {day}
                    </div>
                {/each}
            </div>

            <div class="grid grid-cols-7 gap-2">
                {#each calendarDays as day}
                    {#if day}
                        {@const dateStr = day.toISOString().split("T")[0]}
                        {@const log = logsByDate[dateStr]}

                        <div
                            class="aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-all hover:scale-105
                {log
                                ? 'bg-blue-500/20 text-blue-100 shadow-sm border border-blue-400/20'
                                : 'bg-white/5 text-white/20'}"
                            style="opacity: {log ? 0.6 + log.quality / 10 : 1}"
                        >
                            <span class="text-sm font-medium"
                                >{day.getDate()}</span
                            >
                            {#if log}
                                <div class="flex gap-0.5 text-[8px] mt-1">
                                    {#each Array(Math.min(3, log.quality)) as _}
                                        <span class="text-yellow-200">✨</span>
                                    {/each}
                                </div>
                            {/if}

                            <!-- Tooltip -->
                            {#if log}
                                <div
                                    class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-blue-50 text-xs px-3 py-2 rounded-xl border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity"
                                >
                                    <div class="font-bold">
                                        {Math.floor(log.durationMinutes / 60)}h
                                        {log.durationMinutes % 60}m
                                    </div>
                                    <div class="text-blue-200/60">
                                        {formatTime(log.bedtime)} -
                                        {formatTime(log.wakeTime)}
                                    </div>
                                    <div
                                        class="text-yellow-200 text-[10px] mt-1"
                                    >
                                        {$t("sleep.quality")}: {log.quality}/5
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div class="aspect-square"></div>
                    {/if}
                {/each}
            </div>
        </div>

        <!-- Log Sleep Form -->
        <div
            class="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl"
        >
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🌙</span>
                {$t("sleep.logLastNight")}
            </h2>

            <form
                method="POST"
                action="?/log"
                use:enhance={() => {
                    logging = true;
                    return async ({ update }) => {
                        await update();
                        logging = false;
                    };
                }}
                class="space-y-4"
            >
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label
                            for="bedtime"
                            class="text-xs text-blue-200/80 ml-1"
                            >{$t("sleep.bedtime")}</label
                        >
                        <input
                            id="bedtime"
                            type="datetime-local"
                            name="bedtime"
                            value={defaultBedtime}
                            required
                            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                        />
                    </div>
                    <div class="space-y-1">
                        <label
                            for="wakeTime"
                            class="text-xs text-blue-200/80 ml-1"
                            >{$t("sleep.wakeTime")}</label
                        >
                        <input
                            id="wakeTime"
                            type="datetime-local"
                            name="wakeTime"
                            value={defaultWakeTime}
                            required
                            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                        />
                    </div>
                </div>

                <button
                    disabled={logging}
                    class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {logging ? $t("sleep.saving") : $t("sleep.save")}
                </button>
            </form>
        </div>

        <!-- Recent History -->
        <div class="space-y-3">
            <h3
                class="text-sm font-semibold text-blue-200/60 uppercase tracking-wider ml-2"
            >
                {$t("sleep.recentNights")}
            </h3>
            {#each data.recentLogs as log}
                <div
                    class="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 group"
                >
                    <div>
                        <div class="font-medium text-blue-100">
                            {formatDate(log.bedtime)}
                        </div>
                        <div class="text-xs text-blue-200/50">
                            {formatTime(log.bedtime)} - {formatTime(
                                log.wakeTime,
                            )}
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <div class="font-bold text-lg text-blue-200">
                                {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes %
                                    60}m
                            </div>
                            <div class="flex gap-0.5 justify-end text-[10px]">
                                {#each Array(log.quality) as _}
                                    <span>✨</span>
                                {/each}
                            </div>
                        </div>
                        <form
                            action="?/delete"
                            method="POST"
                            use:enhance
                            on:submit={(e) => {
                                if (!confirm($locale === 'th' 
                                    ? `ต้องการลบบันทึกการนอนวันที่ ${formatDate(log.bedtime)} หรือไม่?`
                                    : `Delete sleep log from ${formatDate(log.bedtime)}?`)) {
                                    e.preventDefault();
                                }
                            }}
                            class="transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <input type="hidden" name="id" value={log.id} />
                            <button
                                type="submit"
                                class="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/5 transition-colors touch-manipulation"
                                title={$t("sleep.delete")}
                            >
                                🗑️
                            </button>
                        </form>
                    </div>
                </div>
            {/each}
            {#if data.recentLogs.length === 0}
                <div class="text-center py-8 text-blue-200/30 italic">
                    {$t("sleep.noLogs")}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0);
            opacity: 0.8;
        }
        50% {
            transform: translate(10px, -10px);
            opacity: 0.4;
        }
    }
    .animate-float {
        animation-name: float;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
    }
</style>
