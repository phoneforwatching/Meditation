import { verifyToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Handle ngrok forwarded headers
    const forwardedProto = event.request.headers.get('x-forwarded-proto');
    const forwardedHost = event.request.headers.get('x-forwarded-host');
    
    if (forwardedProto && forwardedHost) {
        // Reconstruct the URL with the forwarded headers
        const originalUrl = event.url;
        event.url = new URL(
            originalUrl.pathname + originalUrl.search,
            `${forwardedProto}://${forwardedHost}`
        );
    }
    
    const token = event.cookies.get('session');

    if (token) {
        console.log(`[${event.url.pathname}] Session token found`);
        const payload = verifyToken(token);
        if (payload) {
            try {
                const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
                if (user) {
                    console.log(`[${event.url.pathname}] User found: ${user.email}`);
                    event.locals.user = {
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                    };
                } else {
                    console.log(`[${event.url.pathname}] User not found in DB for ID: ${payload.userId}`);
                    event.locals.user = null;
                }
            } catch (e) {
                console.error(`[${event.url.pathname}] Auth error:`, e);
                event.locals.user = null;
            }
        } else {
            console.log(`[${event.url.pathname}] Token verification failed`);
            event.locals.user = null;
        }
    } else {
        console.log(`[${event.url.pathname}] No session token found`);
        event.locals.user = null;
    }

    return resolve(event);
};
