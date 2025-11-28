import { db } from '$lib/server/db';
import { nudges, users } from '$lib/server/schema';
import { eq, and, desc } from 'drizzle-orm';

export const load = async ({ locals }) => {
    let unreadNudges = [];

    if (locals.user) {
        unreadNudges = await db.select({
            senderName: users.displayName,
            createdAt: nudges.createdAt
        })
            .from(nudges)
            .innerJoin(users, eq(nudges.senderId, users.id))
            .where(and(eq(nudges.receiverId, locals.user.id), eq(nudges.isRead, false)))
            .orderBy(desc(nudges.createdAt));
    }

    return {
        user: locals.user,
        nudges: unreadNudges
    };
};
