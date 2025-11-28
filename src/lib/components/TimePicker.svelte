<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";

    export let value: string; // HH:mm format
    export let label: string;

    const dispatch = createEventDispatcher();

    let isOpen = false;
    let mode: "hour" | "minute" = "hour";

    $: [hours, minutes] = value.split(":").map(Number);

    function toggle() {
        isOpen = !isOpen;
        if (isOpen) mode = "hour";
    }

    function selectHour(h: number) {
        hours = h;
        updateValue();
        mode = "minute";
    }

    function selectMinute(m: number) {
        minutes = m;
        updateValue();
        setTimeout(() => {
            isOpen = false;
        }, 300);
    }

    function updateValue() {
        const h = hours.toString().padStart(2, "0");
        const m = minutes.toString().padStart(2, "0");
        value = `${h}:${m}`;
        dispatch("change", value);
    }

    // Clock face numbers
    const hourNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
    const minuteNumbers = Array.from({ length: 12 }, (_, i) => i * 5);

    // Helper to calculate position
    function getPos(index: number, total: number, radius: number) {
        const angle = (index * (360 / total) - 90) * (Math.PI / 180);
        return {
            x: 50 + radius * Math.cos(angle),
            y: 50 + radius * Math.sin(angle),
        };
    }
</script>

<div class="relative">
    <label class="block text-xs text-blue-200/80 ml-1 mb-1">{label}</label>
    <button
        type="button"
        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-left text-lg font-mono flex items-center justify-between hover:bg-slate-800/70 transition-colors"
        on:click={toggle}
    >
        <span>{value}</span>
        <span class="text-xl">🕒</span>
    </button>

    {#if isOpen}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            transition:fade
            on:click|self={() => (isOpen = false)}
        >
            <div
                class="bg-slate-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-white/10"
                transition:scale
            >
                <div class="text-center mb-6">
                    <div
                        class="flex justify-center items-end gap-2 text-4xl font-bold text-white"
                    >
                        <button
                            class="p-2 rounded-lg {mode === 'hour'
                                ? 'bg-blue-600'
                                : 'hover:bg-white/10'}"
                            on:click={() => (mode = "hour")}
                        >
                            {hours.toString().padStart(2, "0")}
                        </button>
                        <span class="pb-2">:</span>
                        <button
                            class="p-2 rounded-lg {mode === 'minute'
                                ? 'bg-blue-600'
                                : 'hover:bg-white/10'}"
                            on:click={() => (mode = "minute")}
                        >
                            {minutes.toString().padStart(2, "0")}
                        </button>
                    </div>
                </div>

                <!-- Clock Face -->
                <div
                    class="relative aspect-square bg-slate-800 rounded-full mb-4 shadow-inner"
                >
                    <!-- Center Dot -->
                    <div
                        class="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-10"
                    ></div>

                    {#if mode === "hour"}
                        <!-- Inner Circle (13-00) -->
                        {#each Array.from({ length: 12 }, (_, i) => i) as h}
                            {@const pos = getPos(h, 12, 28)}
                            <button
                                class="absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                  {hours === (h === 0 ? 12 : h) + 12 || (hours === 0 && h === 0)
                                    ? 'bg-blue-500 text-white scale-110 shadow-lg z-10'
                                    : 'text-slate-400 hover:bg-white/10'}"
                                style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%);"
                                on:click={() =>
                                    selectHour(h === 0 ? 0 : h + 12)}
                            >
                                {h === 0 ? "00" : h + 12}
                            </button>
                        {/each}

                        <!-- Outer Circle (1-12) -->
                        {#each hourNumbers as h}
                            {@const pos = getPos(h, 12, 42)}
                            <button
                                class="absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  {hours === h || (hours === 0 && h === 12)
                                    ? 'bg-blue-500 text-white scale-110 shadow-lg z-10'
                                    : 'text-white hover:bg-white/10'}"
                                style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%);"
                                on:click={() => selectHour(h === 12 ? 0 : h)}
                            >
                                {h}
                            </button>
                        {/each}
                    {:else}
                        <!-- Minutes -->
                        {#each minuteNumbers as m, i}
                            {@const pos = getPos(i, 12, 40)}
                            <button
                                class="absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  {minutes === m
                                    ? 'bg-blue-500 text-white scale-110 shadow-lg z-10'
                                    : 'text-white hover:bg-white/10'}"
                                style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%);"
                                on:click={() => selectMinute(m)}
                            >
                                {m}
                            </button>
                        {/each}
                        <!-- Minute ticks -->
                        {#each Array.from({ length: 60 }) as _, i}
                            {#if i % 5 !== 0}
                                {@const pos = getPos(i, 60, 40)}
                                <div
                                    class="absolute w-1 h-1 bg-white/20 rounded-full"
                                    style="left: {pos.x}%; top: {pos.y}%; transform: translate(-50%, -50%);"
                                ></div>
                            {/if}
                        {/each}
                    {/if}

                    <!-- Hand (Visual only, simplified) -->
                    <div
                        class="absolute top-1/2 left-1/2 h-1 bg-blue-500 origin-left rounded-full pointer-events-none opacity-50"
                        style="
               width: {mode === 'hour'
                            ? hours > 12 || hours === 0
                                ? '28%'
                                : '42%'
                            : '40%'};
               transform: rotate({(mode === 'hour'
                            ? (hours % 12) * 30
                            : minutes * 6) - 90}deg);
             "
                    ></div>
                </div>

                <div class="flex justify-between">
                    <button
                        class="text-slate-400 hover:text-white"
                        on:click={() => (isOpen = false)}>Cancel</button
                    >
                    <button
                        class="text-blue-400 font-bold hover:text-blue-300"
                        on:click={() => (isOpen = false)}>Done</button
                    >
                </div>
            </div>
        </div>
    {/if}
</div>
