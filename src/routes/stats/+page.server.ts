import { db } from '$lib/server/db';
import { meditationSessions } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) throw redirect(302, '/login');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await db.select()
        .from(meditationSessions)
        .where(eq(meditationSessions.userId, locals.user.id))
        .orderBy(desc(meditationSessions.completedAt));

    const recentSessions = sessions.filter(s => s.completedAt && new Date(s.completedAt) >= thirtyDaysAgo);

    // Group by type
    const typeDistribution: Record<string, number> = {};
    sessions.forEach(s => {
        typeDistribution[s.sessionType] = (typeDistribution[s.sessionType] || 0) + 1;
    });

    // Group by day for all history
    const dailyMinutes: Record<string, number> = {};
    sessions.forEach(s => {
        if (!s.completedAt) return;
        const date = new Date(s.completedAt).toISOString().split('T')[0];
        dailyMinutes[date] = (dailyMinutes[date] || 0) + s.durationMinutes;
    });

    return {
        typeDistribution,
        dailyMinutes,
        totalSessions: sessions.length,
    };
}
