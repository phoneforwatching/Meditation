import { db } from './db';
import { notifications } from './schema';

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
