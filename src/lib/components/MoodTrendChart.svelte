<script lang="ts">
  import { t, locale } from "$lib/i18n";

  export let moodData: { day: string; avgMood: number; sessionCount: number }[] = [];

  const WIDTH = 600;
  const HEIGHT = 200;
  const PAD = { top: 20, right: 20, bottom: 35, left: 36 };
  const cW = WIDTH - PAD.left - PAD.right;
  const cH = HEIGHT - PAD.top - PAD.bottom;

  function moodColor(mood: number): string {
    if (mood <= 1.5) return "#EF4444";
    if (mood <= 2.5) return "#F97316";
    if (mood <= 3.5) return "#C4A484";
    if (mood <= 4.0) return "#3B82F6";
    return "#4A7C59";
  }

  $: points = moodData.map((d, i) => {
    const x =
      PAD.left +
      (moodData.length === 1 ? cW / 2 : (i / (moodData.length - 1)) * cW);
    const y = PAD.top + cH - ((d.avgMood - 1) / 4) * cH;
    return { x, y, ...d };
  });

  $: polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  $: areaPoints =
    points.length > 1
      ? `${PAD.left},${PAD.top + cH} ${polylinePoints} ${points[points.length - 1].x},${PAD.top + cH}`
      : "";

  const yLabels = [
    { value: 5, emoji: "\u{1F60A}" },
    { value: 4, emoji: "\u{1F642}" },
    { value: 3, emoji: "\u{1F610}" },
    { value: 2, emoji: "\u{1F615}" },
    { value: 1, emoji: "\u{1F62B}" },
  ];

  function labelInterval(len: number): number {
    if (len <= 7) return 1;
    return Math.ceil(len / 7);
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString($locale === "th" ? "th-TH" : "en-US", {
      month: "short",
      day: "numeric",
    });
  }
</script>

<div
  class="bg-white rounded-2xl border border-earth/10 p-4 shadow-sm overflow-x-auto"
>
  <h3 class="text-lg font-bold text-slate mb-4">{$t("insights.moodTrend")}</h3>

  {#if moodData.length === 0}
    <div class="py-12 text-center text-slate/50 text-sm">
      <p class="text-3xl mb-2">{"\u{1F4CA}"}</p>
      <p>{$t("insights.noMoodData")}</p>
    </div>
  {:else}
    <svg
      viewBox="0 0 {WIDTH} {HEIGHT}"
      class="w-full min-w-[400px]"
      role="img"
      aria-label={$t("insights.moodTrend")}
    >
      <defs>
        <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4A7C59" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#4A7C59" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      {#each yLabels as label}
        {@const y = PAD.top + cH - ((label.value - 1) / 4) * cH}
        <line
          x1={PAD.left}
          y1={y}
          x2={WIDTH - PAD.right}
          y2={y}
          stroke="#E5E7EB"
          stroke-width="1"
          stroke-dasharray="4"
        />
        <text
          x={PAD.left - 6}
          y={y + 5}
          text-anchor="end"
          font-size="12"
          fill="currentColor"
          class="text-slate/50">{label.emoji}</text
        >
      {/each}

      <!-- Area fill -->
      {#if points.length > 1}
        <polygon points={areaPoints} fill="url(#moodAreaGrad)" />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#4A7C59"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {/if}

      <!-- Data points -->
      {#each points as point}
        <circle
          cx={point.x}
          cy={point.y}
          r="5"
          fill={moodColor(point.avgMood)}
          stroke="white"
          stroke-width="2"
        >
          <title
            >{formatDate(point.day)}: {point.avgMood}/5 ({point.sessionCount}
            {$t("insights.sessions")})</title
          >
        </circle>
      {/each}

      <!-- X-axis labels -->
      {#each points as point, i}
        {#if i % labelInterval(points.length) === 0 || i === points.length - 1}
          <text
            x={point.x}
            y={HEIGHT - 5}
            text-anchor="middle"
            font-size="10"
            fill="currentColor"
            class="text-slate/40"
          >
            {formatDate(point.day)}
          </text>
        {/if}
      {/each}
    </svg>
  {/if}
</div>
