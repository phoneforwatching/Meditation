import { db } from './db';
import { users, profiles } from './schema';
import { desc, eq } from 'drizzle-orm';

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
