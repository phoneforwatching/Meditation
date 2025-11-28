import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, profiles, accounts } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allUsers = await db.select().from(users);
        let migratedCount = 0;

        for (const user of allUsers) {
            // Check if profile exists
            const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, user.id));

            if (existingProfile.length === 0) {
                // Create profile
                await db.insert(profiles).values({
                    userId: user.id,
                    displayName: user.displayName,
                    timezone: user.timezone || 'UTC',
                    dailyGoalMinutes: user.dailyGoalMinutes || 10,
                });
            }

            // Check if account exists (if googleId is present)
            if (user.googleId) {
                const existingAccount = await db.select().from(accounts).where(eq(accounts.userId, user.id));
                if (existingAccount.length === 0) {
                    await db.insert(accounts).values({
                        userId: user.id,
                        provider: 'google',
                        providerAccountId: user.googleId,
                    });
                }
            }
            migratedCount++;
        }

        return json({ success: true, migrated: migratedCount });
    } catch (e) {
        return json({ error: e.message }, { status: 500 });
    }
}
