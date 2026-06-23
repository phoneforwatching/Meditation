import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const currentUserId = locals.user.id;

    // One row per conversation partner = the most recent message exchanged.
    // DISTINCT ON does the dedup in Postgres instead of pulling the user's
    // entire message history into the server and looping in JS.
    const rows = await db.execute(sql`
        SELECT DISTINCT ON (other_user_id)
            other_user_id        AS "otherUserId",
            p.display_name        AS "otherUserName",
            m.content             AS "content",
            m.created_at          AS "createdAt",
            m.sender_id           AS "senderId",
            m.receiver_id         AS "receiverId",
            (m.is_read = false AND m.receiver_id = ${currentUserId}) AS "isUnread"
        FROM (
            SELECT *,
                CASE WHEN sender_id = ${currentUserId} THEN receiver_id ELSE sender_id END AS other_user_id
            FROM messages
            WHERE sender_id = ${currentUserId} OR receiver_id = ${currentUserId}
        ) m
        LEFT JOIN profiles p ON p.user_id = m.other_user_id
        ORDER BY other_user_id, m.created_at DESC
    `);

    // Present most-recent conversation first.
    const conversations = (rows.rows as any[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
        conversations,
        user: locals.user
    };
}
