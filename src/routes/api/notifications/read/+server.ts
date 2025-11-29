import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export async function POST({ locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await db.update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.userId, locals.user.id),
                    eq(notifications.isRead, false)
                )
            );

        return json({ success: true });
    } catch (e) {
        console.error('Failed to mark notifications as read', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
