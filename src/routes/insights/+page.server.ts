import { db } from '$lib/server/db';
import { meditationSessions } from '$lib/server/schema';
import { eq, and, desc, sql, gt, isNotNull, gte } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

function computeBestStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    let best = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
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

function computeCurrentStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const formatDateKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const dateSet = new Set(dates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let check = new Date(today);

    if (dateSet.has(formatDateKey(check))) {
        while (dateSet.has(formatDateKey(check))) {
            streak++;
            check.setDate(check.getDate() - 1);
        }
    } else {
        check.setDate(check.getDate() - 1);
        if (dateSet.has(formatDateKey(check))) {
            while (dateSet.has(formatDateKey(check))) {
                streak++;
                check.setDate(check.getDate() - 1);
            }
        }
    }
    return streak;
}

type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

function hourToBucket(hour: number): TimeBucket {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
}

export async function load({ locals, url }) {
    if (!locals.user) throw redirect(302, '/login');

    const userId = locals.user.id;
    const period = Number(url.searchParams.get('period') || '30');
    const daysBack = period === 7 ? 7 : 30;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    const baseFilter = and(
        eq(meditationSessions.userId, userId),
        gt(meditationSessions.durationMinutes, 0),
        isNotNull(meditationSessions.completedAt)
    );

    const periodFilter = and(baseFilter, gte(meditationSessions.completedAt, startDate));
    const moodFilter = (base: any) => and(base, isNotNull(meditationSessions.moodRating));

    const [
        moodByDay,
        thisWeekMood,
        lastWeekMood,
        typeDistribution,
        moodByType,
        hourDistribution,
        moodByHour,
        weekdayDistribution,
        periodTotals,
        allDailyDates,
    ] = await Promise.all([
        // 1. Mood trend by day
        db.select({
            day: sql<string>`DATE(${meditationSessions.completedAt})`,
            avgMood: sql<number>`ROUND(AVG(${meditationSessions.moodRating})::numeric, 1)`,
            sessionCount: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(moodFilter(periodFilter))
            .groupBy(sql`DATE(${meditationSessions.completedAt})`)
            .orderBy(sql`DATE(${meditationSessions.completedAt})`),

        // 2. Avg mood this week
        db.select({
            avgMood: sql<number>`ROUND(AVG(${meditationSessions.moodRating})::numeric, 2)`,
        })
            .from(meditationSessions)
            .where(moodFilter(and(baseFilter, gte(meditationSessions.completedAt, oneWeekAgo)))),

        // 3. Avg mood last week
        db.select({
            avgMood: sql<number>`ROUND(AVG(${meditationSessions.moodRating})::numeric, 2)`,
        })
            .from(meditationSessions)
            .where(moodFilter(and(
                baseFilter,
                gte(meditationSessions.completedAt, twoWeeksAgo),
                sql`${meditationSessions.completedAt} < ${oneWeekAgo}`
            ))),

        // 4. Type distribution
        db.select({
            sessionType: meditationSessions.sessionType,
            count: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(periodFilter)
            .groupBy(meditationSessions.sessionType)
            .orderBy(sql`COUNT(*) DESC`),

        // 5. Mood by type
        db.select({
            sessionType: meditationSessions.sessionType,
            avgMood: sql<number>`ROUND(AVG(${meditationSessions.moodRating})::numeric, 2)`,
            count: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(moodFilter(baseFilter))
            .groupBy(meditationSessions.sessionType)
            .orderBy(sql`AVG(${meditationSessions.moodRating}) DESC`),

        // 6. Hour distribution
        db.select({
            hour: sql<number>`EXTRACT(HOUR FROM ${meditationSessions.completedAt})`,
            count: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(baseFilter)
            .groupBy(sql`EXTRACT(HOUR FROM ${meditationSessions.completedAt})`),

        // 7. Mood by hour
        db.select({
            hour: sql<number>`EXTRACT(HOUR FROM ${meditationSessions.completedAt})`,
            avgMood: sql<number>`ROUND(AVG(${meditationSessions.moodRating})::numeric, 2)`,
        })
            .from(meditationSessions)
            .where(moodFilter(baseFilter))
            .groupBy(sql`EXTRACT(HOUR FROM ${meditationSessions.completedAt})`),

        // 8. Weekday distribution
        db.select({
            dow: sql<number>`EXTRACT(DOW FROM ${meditationSessions.completedAt})`,
            count: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(baseFilter)
            .groupBy(sql`EXTRACT(DOW FROM ${meditationSessions.completedAt})`),

        // 9. Period totals
        db.select({
            totalMinutes: sql<number>`COALESCE(SUM(${meditationSessions.durationMinutes}), 0)`,
            totalSessions: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(periodFilter),

        // 10. All unique dates for streak calculation
        db.select({
            day: sql<string>`DISTINCT DATE(${meditationSessions.completedAt})`,
        })
            .from(meditationSessions)
            .where(baseFilter)
            .orderBy(sql`DATE(${meditationSessions.completedAt})`),
    ]);

    const allDates = allDailyDates.map((r) => String(r.day));
    const bestStreak = computeBestStreak(allDates);
    const currentStreak = computeCurrentStreak(allDates);

    // Compute best mood type
    const bestMoodType = moodByType.length > 0 ? moodByType[0] : null;

    // Compute busiest weekday
    const weekdayNames = {
        en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    };
    const busiestDow = weekdayDistribution.length > 0
        ? weekdayDistribution.reduce((max, row) =>
            Number(row.count) > Number(max.count) ? row : max,
            weekdayDistribution[0]
        )
        : null;

    // Compute best time-of-day bucket by mood
    const bucketMoods: Record<TimeBucket, { sum: number; count: number }> = {
        morning: { sum: 0, count: 0 },
        afternoon: { sum: 0, count: 0 },
        evening: { sum: 0, count: 0 },
        night: { sum: 0, count: 0 },
    };
    for (const row of moodByHour) {
        const bucket = hourToBucket(Number(row.hour));
        bucketMoods[bucket].sum += Number(row.avgMood);
        bucketMoods[bucket].count += 1;
    }
    let bestTimeBucket: TimeBucket | null = null;
    let bestTimeMood = 0;
    for (const [bucket, data] of Object.entries(bucketMoods) as [TimeBucket, { sum: number; count: number }][]) {
        if (data.count > 0) {
            const avg = data.sum / data.count;
            if (avg > bestTimeMood) {
                bestTimeMood = avg;
                bestTimeBucket = bucket;
            }
        }
    }

    return {
        period: daysBack,
        moodTrend: moodByDay.map((r) => ({
            day: String(r.day),
            avgMood: Number(r.avgMood),
            sessionCount: Number(r.sessionCount),
        })),
        thisWeekAvgMood: Number(thisWeekMood[0]?.avgMood ?? 0),
        lastWeekAvgMood: Number(lastWeekMood[0]?.avgMood ?? 0),
        typeDistribution: typeDistribution.map((r) => ({
            sessionType: r.sessionType,
            count: Number(r.count),
        })),
        moodByType: moodByType.map((r) => ({
            sessionType: r.sessionType,
            avgMood: Number(r.avgMood),
            count: Number(r.count),
        })),
        periodTotals: {
            totalMinutes: Number(periodTotals[0]?.totalMinutes ?? 0),
            totalSessions: Number(periodTotals[0]?.totalSessions ?? 0),
        },
        currentStreak,
        bestStreak,
        insights: {
            bestMoodType: bestMoodType?.sessionType ?? null,
            bestMoodTypeAvg: bestMoodType ? Number(bestMoodType.avgMood) : null,
            busiestWeekday: busiestDow ? Number(busiestDow.dow) : null,
            bestTimeOfDay: bestTimeBucket,
            bestTimeOfDayMood: Math.round(bestTimeMood * 10) / 10,
        },
        weekdayNames,
    };
}
