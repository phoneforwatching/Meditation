import { db } from '$lib/server/db';
import { users, messages, profiles } from '$lib/server/schema';
import { eq, or, and, desc } from 'drizzle-orm';
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
    const [otherUser] = await db.select({
        id: users.id,
        displayName: profiles.displayName
    })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, otherUserId));

    if (!otherUser) {
        throw error(404, 'User not found');
    }

    // Get the most recent page of conversation history, returned chronologically.
    const recent = await db.select()
        .from(messages)
        .where(
            or(
                and(eq(messages.senderId, currentUserId), eq(messages.receiverId, otherUserId)),
                and(eq(messages.senderId, otherUserId), eq(messages.receiverId, currentUserId))
            )
        )
        .orderBy(desc(messages.createdAt))
        .limit(50);

    return {
        otherUser,
        initialMessages: recent.reverse(),
        currentUserId
    };
}
