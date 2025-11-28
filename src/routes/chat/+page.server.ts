import { db } from '$lib/server/db';
import { users, messages, profiles } from '$lib/server/schema';
import { eq, or, desc, ne, and, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const currentUserId = locals.user.id;

    // Get list of users we have chatted with
    // This is a bit complex in SQL, so we'll simplify:
    // Get all messages where we are sender or receiver
    // Then extract unique other user IDs

    const recentMessages = await db.select({
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        createdAt: messages.createdAt,
        content: messages.content,
        otherUserId: sql<number>`CASE WHEN ${messages.senderId} = ${currentUserId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`,
        otherUserName: profiles.displayName
    })
        .from(messages)
        .leftJoin(users, eq(users.id, sql`CASE WHEN ${messages.senderId} = ${currentUserId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(or(eq(messages.senderId, currentUserId), eq(messages.receiverId, currentUserId)))
        .orderBy(desc(messages.createdAt));

    // Deduplicate by otherUserId
    const uniqueConversations = [];
    const seenUsers = new Set();

    for (const msg of recentMessages) {
        if (!seenUsers.has(msg.otherUserId)) {
            seenUsers.add(msg.otherUserId);
            uniqueConversations.push(msg);
        }
    }

    return {
        conversations: uniqueConversations,
        user: locals.user
    };
}
