import { db } from '$lib/server/db';
import { notifications, messages } from '$lib/server/schema';
import { eq, and, desc, count } from 'drizzle-orm';

export const load = async ({ locals }) => {
    let unreadNotifications: typeof notifications.$inferSelect[] = [];
    let unreadMessageCount = 0;

    if (locals.user) {
        unreadNotifications = await db.select()
            .from(notifications)
            .where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)))
            .orderBy(desc(notifications.createdAt));

        const [messageCount] = await db.select({ count: count() })
            .from(messages)
            .where(and(
                eq(messages.receiverId, locals.user.id),
                eq(messages.isRead, false)
            ));

        unreadMessageCount = Number(messageCount.count ?? 0);
    }

    return {
        user: locals.user,
        notifications: unreadNotifications,
        unreadMessageCount
    };
};
