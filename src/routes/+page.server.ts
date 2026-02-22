import { evaluateAchievements } from '$lib/achievements';
import { db } from '$lib/server/db';
import { meditationSessions, profiles } from '$lib/server/schema';
import { eq, desc, and, sql, gt, isNotNull } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const userId = locals.user.id;
    const completedSessionFilter = and(
        eq(meditationSessions.userId, userId),
        gt(meditationSessions.durationMinutes, 0),
        isNotNull(meditationSessions.completedAt)
    );

    const [
        totals,
        dailyRows,
        typeRows,
        recentSessions,
        profileRows
    ] = await Promise.all([
        db.select({
            totalMinutes: sql<number>`COALESCE(SUM(${meditationSessions.durationMinutes}), 0)`,
            totalSessions: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(completedSessionFilter),
        db.select({
            day: sql<string>`DATE(${meditationSessions.completedAt})`,
            minutes: sql<number>`COALESCE(SUM(${meditationSessions.durationMinutes}), 0)`
        })
            .from(meditationSessions)
            .where(completedSessionFilter)
            .groupBy(sql`DATE(${meditationSessions.completedAt})`)
            .orderBy(sql`DATE(${meditationSessions.completedAt}) DESC`),
        db.select({
            sessionType: meditationSessions.sessionType,
            count: sql<number>`COUNT(*)`,
        })
            .from(meditationSessions)
            .where(completedSessionFilter)
            .groupBy(meditationSessions.sessionType),
        db.select()
            .from(meditationSessions)
            .where(completedSessionFilter)
            .orderBy(desc(meditationSessions.completedAt))
            .limit(5),
        db.select({
            dailyGoalMinutes: profiles.dailyGoalMinutes
        })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1)
    ]);

    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const normalizeDay = (value: string | Date) => {
        if (typeof value === 'string') return value;
        return formatDateKey(value);
    };

    const totalMinutes = Number(totals[0]?.totalMinutes ?? 0);
    const totalSessions = Number(totals[0]?.totalSessions ?? 0);
    const dailyGoalMinutes = Math.max(1, Number(profileRows[0]?.dailyGoalMinutes ?? 10));

    // Simple streak calculation
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDates = new Set(dailyRows.map(row => normalizeDay(row.day)));

    let currentCheck = new Date(today);
    const todayStr = formatDateKey(currentCheck);

    if (sessionDates.has(todayStr)) {
        // Meditated today
        while (true) {
            const dateStr = formatDateKey(currentCheck);
            if (sessionDates.has(dateStr)) {
                streak++;
                currentCheck.setDate(currentCheck.getDate() - 1);
            } else {
                break;
            }
        }
    } else {
        // Check yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateKey(yesterday);

        if (sessionDates.has(yesterdayStr)) {
            currentCheck = yesterday;
            while (true) {
                const dateStr = formatDateKey(currentCheck);
                if (sessionDates.has(dateStr)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        } else {
            streak = 0;
        }
    }

    // Group by type
    const typeDistribution: Record<string, number> = {};
    typeRows.forEach(row => {
        if (!row.sessionType) return;
        typeDistribution[row.sessionType] = Number(row.count ?? 0);
    });

    // Group by day for all history
    const dailyMinutes: Record<string, number> = {};
    dailyRows.forEach(row => {
        const dayKey = normalizeDay(row.day);
        if (!dayKey) return;
        dailyMinutes[dayKey] = Number(row.minutes ?? 0);
    });

    return {
        user: locals.user,
        totalMinutes,
        totalSessions,
        streak,
        dailyGoalMinutes,
        recentSessions,
        typeDistribution,
        dailyMinutes,
        achievements: evaluateAchievements({
            totalMinutes,
            totalSessions,
            streak
        }),
    };
}

export const actions = {
    delete: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const id = Number(data.get('id'));

        if (!id) return fail(400, { error: 'Missing ID' });

        // Delete only the specific session that belongs to this user
        await db.delete(meditationSessions)
            .where(
                and(
                    eq(meditationSessions.id, id),
                    eq(meditationSessions.userId, locals.user.id)
                )
            );

        return { success: true };
    }
};
