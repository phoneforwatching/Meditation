import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pushSubscriptions } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Register (or refresh) a Web Push subscription for the current user.
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await request.json().catch(() => null);
    const endpoint: string | undefined = sub?.endpoint;
    const p256dh: string | undefined = sub?.keys?.p256dh;
    const auth: string | undefined = sub?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
        return json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert on the unique endpoint, re-pointing it at the current user.
    await db.insert(pushSubscriptions)
        .values({ userId: locals.user.id, endpoint, p256dh, auth })
        .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: { userId: locals.user.id, p256dh, auth },
        });

    return json({ success: true });
};

// Remove a subscription (called on unsubscribe / disable).
export const DELETE: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { endpoint } = await request.json().catch(() => ({ endpoint: undefined }));
    if (!endpoint) {
        return json({ error: 'Missing endpoint' }, { status: 400 });
    }
    await db.delete(pushSubscriptions)
        .where(and(
            eq(pushSubscriptions.endpoint, endpoint),
            eq(pushSubscriptions.userId, locals.user.id)
        ));
    return json({ success: true });
};
