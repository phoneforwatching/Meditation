import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { nudges } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export async function POST({ locals }) {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

    await db.update(nudges)
        .set({ isRead: true })
        .where(and(eq(nudges.receiverId, locals.user.id), eq(nudges.isRead, false)));

    return json({ success: true });
}
