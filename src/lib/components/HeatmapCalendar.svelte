<script lang="ts">
  import { t, locale } from "$lib/i18n";

  export let sessions: {
    completedAt: Date | string | null;
    durationMinutes: number;
  }[] = [];

  // Helper to get date string YYYY-MM-DD
  const getDateStr = (date: Date) => date.toISOString().split('T')[0];

  // Generate last 365 days
  const today = new Date();
  const days: Date[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  // Map sessions to date strings
  $: sessionMap = sessions.reduce((acc, session) => {
    if (!session.completedAt) return acc;
    const dateStr = getDateStr(new Date(session.completedAt));
    acc[dateStr] = (acc[dateStr] || 0) + session.durationMinutes;
    return acc;
  }, {} as Record<string, number>);

  // Get intensity level (0-4)
  function getIntensity(minutes: number) {
    if (!minutes) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  }

  // Colors for intensity levels
  const colors = [
    'bg-earth/10', // Level 0 (Empty)
    'bg-sage/30',  // Level 1
    'bg-sage/50',  // Level 2
    'bg-sage/70',  // Level 3
    'bg-sage',     // Level 4
  ];

  // Group days by week for grid layout
  $: weeks = days.reduce((acc: Date[][], day, i) => {
    const weekIndex = Math.floor(i / 7);
    if (!acc[weekIndex]) acc[weekIndex] = [];
    acc[weekIndex].push(day);
    return acc;
  }, [] as Date[][]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const thMonthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
</script>

<div class="bg-white p-6 rounded-2xl shadow-sm border border-earth/10 overflow-x-auto">
  <h3 class="text-lg font-bold text-slate mb-4">{$t('dashboard.activityMap')}</h3>
  
  <div class="min-w-[600px]">
    <!-- Months Header -->
    <div class="flex text-xs text-slate/40 mb-2 pl-8">
      {#each weeks as week, i}
        {#if i % 4 === 0 && week[0]}
          <div class="flex-1">
            {$locale === 'th' 
              ? thMonthNames[week[0].getMonth()] 
              : monthNames[week[0].getMonth()]}
          </div>
        {/if}
      {/each}
    </div>

    <div class="flex gap-1">
      <!-- Day Labels -->
      <div class="flex flex-col justify-between text-[10px] text-slate/40 pr-2 py-1 h-[100px]">
        <div>Mon</div>
        <div>Wed</div>
        <div>Fri</div>
      </div>

      <!-- Grid -->
      <div class="flex gap-1 flex-1">
        {#each weeks as week}
          <div class="flex flex-col gap-1">
            {#each week as day}
              {@const dateStr = getDateStr(day)}
              {@const minutes = sessionMap[dateStr] || 0}
              {@const intensity = getIntensity(minutes)}
              
              <div
                class="w-3 h-3 rounded-sm {colors[intensity]} transition-colors hover:ring-2 hover:ring-sage/50 relative group"
                title="{dateStr}: {minutes} minutes"
              >
                <!-- Tooltip -->
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {new Date(day).toLocaleDateString($locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' })}: {minutes}m
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-end gap-2 mt-4 text-xs text-slate/40">
      <span>{$t('dashboard.less')}</span>
      {#each colors as color}
        <div class="w-3 h-3 rounded-sm {color}"></div>
      {/each}
      <span>{$t('dashboard.more')}</span>
    </div>
  </div>
</div>
