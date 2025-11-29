import { db } from '$lib/server/db';
import { users, profiles } from '$lib/server/schema';
import { desc, eq } from 'drizzle-orm';

export async function load({ locals }) {
    // Fetch users and profiles sorted by total minutes (dailyGoalMinutes)
    const leaderboard = await db.select({
        id: users.id,
        displayName: profiles.displayName,
        totalMinutes: profiles.totalMinutes,
        avatarUrl: profiles.avatarUrl,
    })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .orderBy(desc(profiles.totalMinutes));

    return {
        leaderboard,
        currentUserId: locals.user?.id
    };
}
