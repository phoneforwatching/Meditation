import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET({ locals }) {
    if (!locals.user) {
        return json({ count: 0 });
    }

    const [result] = await db.select({ count: count() })
        .from(messages)
        .where(and(
            eq(messages.receiverId, locals.user.id),
            eq(messages.isRead, false)
        ));

    return json({ count: result.count });
}
