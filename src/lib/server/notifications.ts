import { db } from './db';
import { notifications, users } from './schema';
import { ne } from 'drizzle-orm';
import { sendPushToUser } from './push';

export async function createNotification(
    userId: number,
    type: 'message' | 'nudge' | 'activity',
    title: string,
    message: string,
    link?: string
) {
    try {
        await db.insert(notifications).values({
            userId,
            type,
            title,
            message,
            link
        });
        // Fire-and-forget web push to the recipient's devices.
        void sendPushToUser(userId, { title, body: message, url: link })
            .catch((e) => console.error('push send failed:', e));
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

export async function broadcastNotification(
    excludeUserId: number,
    type: 'message' | 'nudge' | 'activity',
    title: string,
    message: string,
    link?: string
) {
    try {
        // Get all other users
        const otherUsers = await db.select({ id: users.id })
            .from(users)
            .where(ne(users.id, excludeUserId));

        if (otherUsers.length === 0) return;

        const newNotifications = otherUsers.map(user => ({
            userId: user.id,
            type,
            title,
            message,
            link
        }));

        await db.insert(notifications).values(newNotifications);
    } catch (error) {
        console.error('Failed to broadcast notification:', error);
    }
}
