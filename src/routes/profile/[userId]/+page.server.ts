import { db } from '$lib/server/db';
import { users, profiles, meditationSessions, sleepLogs } from '$lib/server/schema';
import { eq, desc, sql, avg, count } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const userId = Number(params.userId);
    if (isNaN(userId)) throw error(404, 'User not found');

    // 1. Fetch Profile
    const [userProfile] = await db.select({
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        bio: profiles.bio,
        totalMinutes: profiles.totalMinutes,
        createdAt: users.createdAt
    })
        .from(profiles)
        .leftJoin(users, eq(profiles.userId, users.id))
        .where(eq(profiles.userId, userId));

    if (!userProfile) throw error(404, 'User not found');

    // 2. Fetch Meditation Stats (Count)
    const [meditationStats] = await db.select({
        count: count()
    })
        .from(meditationSessions)
        .where(eq(meditationSessions.userId, userId));

    // 3. Fetch Recent Sessions
    const recentSessions = await db.select()
        .from(meditationSessions)
        .where(eq(meditationSessions.userId, userId))
        .orderBy(desc(meditationSessions.createdAt))
        .limit(5);

    // 4. Fetch Sleep Stats (Avg Duration, Avg Quality)
    const [sleepStats] = await db.select({
        avgDuration: sql<number>`avg(${sleepLogs.durationMinutes})`,
        avgQuality: sql<number>`avg(${sleepLogs.quality})`,
        count: count()
    })
        .from(sleepLogs)
        .where(eq(sleepLogs.userId, userId));

    return {
        profile: userProfile,
        meditationStats: {
            totalSessions: meditationStats?.count || 0,
            recentSessions
        },
        sleepStats: {
            avgDuration: Math.round(Number(sleepStats?.avgDuration) || 0),
            avgQuality: Number(sleepStats?.avgQuality) || 0,
            totalLogs: sleepStats?.count || 0
        }
    };
}
