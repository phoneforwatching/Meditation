import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { nudges, profiles } from '$lib/server/schema';
import { and, eq, gt, desc } from 'drizzle-orm';
import { createNotification } from '$lib/server/notifications';

export async function POST({ request, locals }) {
    if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId } = await request.json();

    if (!receiverId || receiverId === locals.user.id) {
        return json({ error: 'Invalid receiver' }, { status: 400 });
    }

    // Check spam: Limit 1 nudge per 24 hours per pair
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentNudge = await db.select().from(nudges).where(
        and(
            eq(nudges.senderId, locals.user.id),
            eq(nudges.receiverId, receiverId),
            gt(nudges.createdAt, yesterday)
        )
    );

    if (recentNudge.length > 0) {
        return json({ error: 'You already nudged this person recently.' }, { status: 429 });
    }

    await db.insert(nudges).values({
        senderId: locals.user.id,
        receiverId,
    });

    // Create Notification
    const [senderProfile] = await db.select({ displayName: profiles.displayName })
        .from(profiles)
        .where(eq(profiles.userId, locals.user.id));

    const senderName = senderProfile?.displayName || 'Someone';

    await createNotification(
        receiverId,
        'nudge',
        'You were nudged!',
        `${senderName} nudged you to meditate.`,
        '/timer'
    );

    return json({ success: true });
}
