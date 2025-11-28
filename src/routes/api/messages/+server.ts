import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages, profiles, notifications } from '$lib/server/schema';
import { eq, or, and, asc, gt, desc } from 'drizzle-orm';
import { createNotification } from '$lib/server/notifications';

export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const senderId = locals.user.id;

    await db.insert(messages).values({
        senderId,
        receiverId,
        content
    });

    // Smart Notification: Check if we already notified this user about a message from this sender recently (e.g., 15 mins)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentNotification = await db.select()
        .from(notifications)
        .where(and(
            eq(notifications.userId, receiverId),
            eq(notifications.type, 'message'),
            eq(notifications.link, `/chat?userId=${senderId}`), // Link contains senderId
            gt(notifications.createdAt, fifteenMinutesAgo)
        ))
        .limit(1);

    if (recentNotification.length === 0) {
        const [senderProfile] = await db.select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.userId, senderId));

        const senderName = senderProfile?.displayName || 'Someone';

        await createNotification(
            receiverId,
            'message',
            'New Message',
            `${senderName} sent you a message`,
            `/chat?userId=${senderId}`
        );
    }

    return json({ success: true });
}

export async function GET({ url, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = locals.user.id;
    const otherUserId = url.searchParams.get('userId');

    if (!otherUserId) {
        return json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const conversation = await db.select()
        .from(messages)
        .where(
            or(
                and(eq(messages.senderId, currentUserId), eq(messages.receiverId, Number(otherUserId))),
                and(eq(messages.senderId, Number(otherUserId)), eq(messages.receiverId, currentUserId))
            )
        )
        .orderBy(asc(messages.createdAt));

    return json(conversation);
}
