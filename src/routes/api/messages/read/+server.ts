import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { senderId } = await request.json();

    if (!senderId) {
        return json({ error: 'Missing senderId' }, { status: 400 });
    }

    const currentUserId = locals.user.id;

    // Mark all messages from senderId to currentUserId as read
    await db.update(messages)
        .set({ isRead: true })
        .where(
            and(
                eq(messages.senderId, senderId),
                eq(messages.receiverId, currentUserId),
                eq(messages.isRead, false)
            )
        );

    return json({ success: true });
}
