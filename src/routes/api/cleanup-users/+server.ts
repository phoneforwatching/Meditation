
import { db } from '$lib/server/db';
import { profiles, users } from '$lib/server/schema';
import { inArray } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET() {
    const namesToDelete = [
        "Nattapat Sombunanek",
        "testing",
        "Aikz Energy",
        "Pattaraton Somsak",
        "Naruemol Chuchom",
        "po.polimental",
        "Tatchakorn Saibunjom"
    ];

    try {
        // First find the user IDs
        const usersToDelete = await db.select({ userId: profiles.userId })
            .from(profiles)
            .where(inArray(profiles.displayName, namesToDelete));

        const ids = usersToDelete.map(u => u.userId);

        console.log(`Found ${ids.length} users to delete matching names: ${namesToDelete.join(', ')}`);

        if (ids.length > 0) {
            // Delete from users table, cascade should handle profile
            await db.delete(users).where(inArray(users.id, ids));
        }

        return json({
            success: true,
            message: `Deleted ${ids.length} users`,
            deletedIds: ids,
            searchedNames: namesToDelete
        });
    } catch (error) {
        console.error("Error deleting users:", error);
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}
