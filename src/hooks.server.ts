import { verifyToken } from '$lib/server/auth';
import { db, getCachedUser, setCachedUser } from '$lib/server/db';
import { users, profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

// Skip auth check for static assets
const SKIP_AUTH_PATHS = ['/favicon.ico', '/_app', '/manifest.json', '/robots.txt'];

export const handle: Handle = async ({ event, resolve }) => {
    // Handle ngrok forwarded headers
    const forwardedProto = event.request.headers.get('x-forwarded-proto');
    const forwardedHost = event.request.headers.get('x-forwarded-host');

    if (forwardedProto && forwardedHost) {
        const originalUrl = event.url;
        event.url = new URL(
            originalUrl.pathname + originalUrl.search,
            `${forwardedProto}://${forwardedHost}`
        );
    }

    // Skip auth for static assets
    if (SKIP_AUTH_PATHS.some(p => event.url.pathname.startsWith(p))) {
        return resolve(event);
    }

    const token = event.cookies.get('session');

    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            // Try cache first
            const cachedUser = getCachedUser(payload.userId);
            if (cachedUser) {
                event.locals.user = cachedUser;
            } else {
                try {
                    const [result] = await db.select({
                        user: users,
                        profile: profiles
                    })
                        .from(users)
                        .leftJoin(profiles, eq(users.id, profiles.userId))
                        .where(eq(users.id, payload.userId));

                    if (result) {
                        const userData = {
                            id: result.user.id,
                            email: result.user.email,
                            displayName: result.profile?.displayName || null,
                            avatarUrl: result.profile?.avatarUrl || null,
                        };
                        event.locals.user = userData;
                        setCachedUser(payload.userId, userData);
                    } else {
                        event.locals.user = null;
                    }
                } catch (e) {
                    console.error(`[${event.url.pathname}] Auth error:`, e);
                    event.locals.user = null;
                }
            }
        } else {
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event);
};
