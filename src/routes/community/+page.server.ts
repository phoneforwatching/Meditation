import { db } from '$lib/server/db';
import { dailyCheckins, meditationSessions, profiles } from '$lib/server/schema';
import { desc, gte, eq, and, gt, isNotNull } from 'drizzle-orm';
import { getTopMeditators } from '$lib/server/queries';

export async function load({ locals }) {
    // Get 24 hours ago timestamp
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [usersData, activeCheckins, recentSessions] = await Promise.all([
        getTopMeditators(50),
        // Active check-ins (last 24h) joined with the poster's profile
        db.select({
            userId: dailyCheckins.userId,
            displayName: profiles.displayName,
            avatarUrl: profiles.avatarUrl,
            photoUrl: dailyCheckins.photoUrl,
            mood: dailyCheckins.mood,
            caption: dailyCheckins.caption,
            createdAt: dailyCheckins.createdAt,
        })
            .from(dailyCheckins)
            .leftJoin(profiles, eq(profiles.userId, dailyCheckins.userId))
            .where(gte(dailyCheckins.createdAt, oneDayAgo))
            .orderBy(desc(dailyCheckins.createdAt)),
        // Recent completed sessions for the activity feed
        db.select({
            userId: meditationSessions.userId,
            displayName: profiles.displayName,
            avatarUrl: profiles.avatarUrl,
            durationMinutes: meditationSessions.durationMinutes,
            sessionType: meditationSessions.sessionType,
            createdAt: meditationSessions.completedAt,
        })
            .from(meditationSessions)
            .leftJoin(profiles, eq(profiles.userId, meditationSessions.userId))
            .where(and(
                gt(meditationSessions.durationMinutes, 0),
                isNotNull(meditationSessions.completedAt)
            ))
            .orderBy(desc(meditationSessions.completedAt))
            .limit(20),
    ]);

    // Map latest check-in to user (for the forest tiles)
    const checkinMap = new Map();
    for (const checkin of activeCheckins) {
        if (!checkinMap.has(checkin.userId)) {
            checkinMap.set(checkin.userId, checkin);
        }
    }

    const leaderboard = usersData.map(user => {
        const checkin = checkinMap.get(user.id);
        return {
            ...user,
            checkinPhoto: checkin?.photoUrl,
            checkinMood: checkin?.mood,
            checkinCaption: checkin?.caption
        };
    });

    // Unified, time-sorted activity feed (sessions + check-ins).
    const activity = [
        ...recentSessions.map((s) => ({
            kind: 'session' as const,
            userId: s.userId,
            displayName: s.displayName,
            avatarUrl: s.avatarUrl,
            minutes: s.durationMinutes,
            sessionType: s.sessionType,
            at: s.createdAt,
        })),
        ...activeCheckins.map((c) => ({
            kind: 'checkin' as const,
            userId: c.userId,
            displayName: c.displayName,
            avatarUrl: c.avatarUrl,
            mood: c.mood,
            caption: c.caption,
            at: c.createdAt,
        })),
    ]
        .filter((a) => a.at)
        .sort((a, b) => new Date(b.at as Date).getTime() - new Date(a.at as Date).getTime())
        .slice(0, 25);

    return {
        leaderboard,
        activity,
        currentUserId: locals.user?.id
    };
}
