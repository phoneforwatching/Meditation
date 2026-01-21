import { db } from '$lib/server/db';
import { notifications, messages } from '$lib/server/schema';
import { eq, and, desc, count } from 'drizzle-orm';

const MAX_NOTIFICATIONS = 20;

export const load = async ({ locals }) => {
    let recentNotifications: typeof notifications.$inferSelect[] = [];
    let unreadNotificationCount = 0;
    let unreadMessageCount = 0;

    if (locals.user) {
        const [
            notificationsResult,
            unreadNotificationsAggregate,
            unreadMessagesAggregate
        ] = await Promise.all([
            db.select()
                .from(notifications)
                .where(eq(notifications.userId, locals.user.id))
                .orderBy(desc(notifications.createdAt))
                .limit(MAX_NOTIFICATIONS),
            db.select({ count: count() })
                .from(notifications)
                .where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false))),
            db.select({ count: count() })
                .from(messages)
                .where(and(
                    eq(messages.receiverId, locals.user.id),
                    eq(messages.isRead, false)
                ))
        ]);

        recentNotifications = notificationsResult;
        unreadNotificationCount = Number(unreadNotificationsAggregate[0]?.count ?? 0);
        unreadMessageCount = Number(unreadMessagesAggregate[0]?.count ?? 0);
    }

    return {
        user: locals.user,
        notifications: recentNotifications,
        unreadNotificationCount,
        unreadMessageCount
    };
};
