import { db } from './db';
import { notifications, users } from './schema';
import { ne } from 'drizzle-orm';

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
