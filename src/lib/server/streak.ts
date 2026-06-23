// Shared streak math for meditation day-keys. A "day key" is a local-date
// string in `YYYY-MM-DD` form (matching Postgres `DATE(completed_at)` output).
// Used by both the home dashboard and the insights page so the two never drift.

export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Current streak: consecutive days ending today (or yesterday, if the user
 * hasn't meditated yet today). Returns 0 if neither today nor yesterday has a
 * session.
 */
export function currentStreak(dayKeys: Iterable<string>): number {
    const dateSet = dayKeys instanceof Set ? dayKeys : new Set(dayKeys);
    if (dateSet.size === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const check = new Date(today);
    // Anchor on today if present, otherwise step back to yesterday.
    if (!dateSet.has(formatDateKey(check))) {
        check.setDate(check.getDate() - 1);
        if (!dateSet.has(formatDateKey(check))) return 0;
    }

    let streak = 0;
    while (dateSet.has(formatDateKey(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
    }
    return streak;
}

/**
 * Longest run of consecutive days anywhere in history.
 * Expects day keys sorted ascending.
 */
export function bestStreak(sortedDayKeys: string[]): number {
    if (sortedDayKeys.length === 0) return 0;
    let best = 1;
    let current = 1;
    for (let i = 1; i < sortedDayKeys.length; i++) {
        const prev = new Date(sortedDayKeys[i - 1]);
        const curr = new Date(sortedDayKeys[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            current++;
            best = Math.max(best, current);
        } else {
            current = 1;
        }
    }
    return best;
}
