import { db } from '$lib/server/db';
import { nudges, users, profiles, messages } from '$lib/server/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export const load = async ({ locals }) => {
    let unreadNudges = [];
    let unreadMessageCount = 0;

    if (locals.user) {
        unreadNudges = await db.select({
            senderName: profiles.displayName,
            createdAt: nudges.createdAt
        })
            .from(nudges)
            .innerJoin(users, eq(nudges.senderId, users.id))
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(and(eq(nudges.receiverId, locals.user.id), eq(nudges.isRead, false)))
            .orderBy(desc(nudges.createdAt));

        const [messageCount] = await db.select({ count: count() })
            .from(messages)
            .where(and(
                eq(messages.receiverId, locals.user.id),
                eq(messages.isRead, false)
            ));

        unreadMessageCount = messageCount.count;
    }

    return {
        user: locals.user,
        nudges: unreadNudges,
        unreadMessageCount
    };
};
