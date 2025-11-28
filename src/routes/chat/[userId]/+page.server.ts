import { db } from '$lib/server/db';
import { users, messages } from '$lib/server/schema';
import { eq, or, and, asc } from 'drizzle-orm';
import { redirect, error } from '@sveltejs/kit';

export async function load({ params, locals }) {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const currentUserId = locals.user.id;
    const otherUserId = parseInt(params.userId);

    if (isNaN(otherUserId)) {
        throw error(400, 'Invalid user ID');
    }

    // Get other user details
    const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));

    if (!otherUser) {
        throw error(404, 'User not found');
    }

    // Get conversation history
    const conversation = await db.select()
        .from(messages)
        .where(
            or(
                and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
                and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
            )
        )
        .orderBy(asc(messages.createdAt));

    return {
        otherUser,
        initialMessages: conversation,
        currentUserId
    };
}
