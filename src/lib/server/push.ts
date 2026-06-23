import webpush from 'web-push';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { pushSubscriptions } from './schema';
import { eq } from 'drizzle-orm';

let configured = false;

/** Lazily configure web-push from env. Returns false if VAPID keys are absent. */
function ensureConfigured(): boolean {
    if (configured) return true;
    const publicKey = env.VAPID_PUBLIC_KEY;
    const privateKey = env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return false;
    webpush.setVapidDetails(
        env.VAPID_SUBJECT || 'mailto:admin@example.com',
        publicKey,
        privateKey
    );
    configured = true;
    return true;
}

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
};

/**
 * Send a push notification to every device registered for a user.
 * Best-effort: failures are logged and dead subscriptions (404/410) are pruned.
 * No-ops silently when VAPID keys aren't configured.
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
    if (!ensureConfigured()) return;

    const subs = await db.select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(subs.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                body
            );
        } catch (e: any) {
            const status = e?.statusCode;
            if (status === 404 || status === 410) {
                // Subscription is gone — remove it.
                await db.delete(pushSubscriptions)
                    .where(eq(pushSubscriptions.endpoint, sub.endpoint))
                    .catch(() => { });
            } else {
                console.error('web-push send failed:', status ?? e);
            }
        }
    }));
}
