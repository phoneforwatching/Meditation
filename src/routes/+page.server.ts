import { evaluateAchievements } from '$lib/achievements';
import { db } from '$lib/server/db';
import { meditationSessions } from '$lib/server/schema';
import { eq, desc, and } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const sessions = await db.select()
        .from(meditationSessions)
        .where(eq(meditationSessions.userId, locals.user.id))
        .orderBy(desc(meditationSessions.completedAt));

    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalSessions = sessions.length;

    // Simple streak calculation
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDates = new Set(sessions.map(s => {
        if (!s.completedAt) return '';
        const d = new Date(s.completedAt);
        return d.toISOString().split('T')[0];
    }));

    let currentCheck = new Date(today);
    const todayStr = currentCheck.toISOString().split('T')[0];

    if (sessionDates.has(todayStr)) {
        // Meditated today
        while (true) {
            const dateStr = currentCheck.toISOString().split('T')[0];
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
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (sessionDates.has(yesterdayStr)) {
            currentCheck = yesterday;
            while (true) {
                const dateStr = currentCheck.toISOString().split('T')[0];
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

    return {
        user: locals.user,
        totalMinutes,
        totalSessions,
        streak,
        recentSessions: sessions.slice(0, 5),
        allSessions: sessions, // Send all sessions for heatmap
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
