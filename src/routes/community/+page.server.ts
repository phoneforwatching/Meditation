import { db } from '$lib/server/db';
import { users, meditationSessions, profiles } from '$lib/server/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function load({ locals }) {
    // Query all users and sum their duration
    // Note: In a real large-scale app, this should be paginated or cached.
    const leaderboard = await db.select({
        id: users.id,
        displayName: profiles.displayName,
        totalMinutes: sql<number>`COALESCE(SUM(${meditationSessions.durationMinutes}), 0)`.mapWith(Number),
    })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .leftJoin(meditationSessions, eq(users.id, meditationSessions.userId))
        .groupBy(users.id, profiles.displayName)
        .orderBy(desc(sql`COALESCE(SUM(${meditationSessions.durationMinutes}), 0)`));

    return {
        leaderboard,
        currentUserId: locals.user?.id
    };
}
