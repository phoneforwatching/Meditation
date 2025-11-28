import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allUsers = await db.select().from(users);
        let migratedCount = 0;

        for (const user of allUsers) {
            const existingProfile = await db
                .select()
                .from(profiles)
                .where(eq(profiles.userId, user.id));

            if (existingProfile.length === 0) {
                await db.insert(profiles).values({
                    userId: user.id,
                    displayName: user.email.split('@')[0],
                    timezone: 'UTC',
                    dailyGoalMinutes: 10,
                });
                migratedCount++;
            }
        }

        return json({ success: true, migrated: migratedCount });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error during migration';
        return json({ error: message }, { status: 500 });
    }
}
