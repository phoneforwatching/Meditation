import { db } from '$lib/server/db';
import { users, profiles, meditationSessions } from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
    // 1. Get all users
    const allUsers = await db.select({ id: users.id }).from(users);
    let updatedCount = 0;

    for (const user of allUsers) {
        // 2. Calculate total minutes from sessions
        const [result] = await db.select({
            total: sql<number>`sum(${meditationSessions.durationMinutes})`
        })
            .from(meditationSessions)
            .where(eq(meditationSessions.userId, user.id));

        const totalMinutes = Number(result?.total) || 0;

        // 3. Update profile
        await db.update(profiles)
            .set({ totalMinutes })
            .where(eq(profiles.userId, user.id));

        updatedCount++;
    }

    return new Response(`Backfill complete. Updated ${updatedCount} users.`);
}
