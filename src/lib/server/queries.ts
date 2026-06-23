import { db } from './db';
import { users, profiles, meditationSessions } from './schema';
import { desc, eq, gte, sql } from 'drizzle-orm';

/**
 * Users ranked by lifetime meditation minutes, with their profile basics.
 * Shared by the leaderboard and community forest views.
 */
export function getTopMeditators(limit: number) {
    return db.select({
        id: users.id,
        displayName: profiles.displayName,
        totalMinutes: profiles.totalMinutes,
        avatarUrl: profiles.avatarUrl,
    })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .orderBy(desc(profiles.totalMinutes))
        .limit(limit);
}

/** Users ranked by minutes meditated in the last 7 days. */
export function getWeeklyMeditators(limit: number) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    return db.select({
        id: users.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        totalMinutes: sql<number>`cast(coalesce(sum(${meditationSessions.durationMinutes}), 0) as int)`,
    })
        .from(users)
        .innerJoin(meditationSessions, eq(meditationSessions.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(gte(meditationSessions.completedAt, since))
        .groupBy(users.id, profiles.displayName, profiles.avatarUrl)
        .orderBy(desc(sql`sum(${meditationSessions.durationMinutes})`))
        .limit(limit);
}
