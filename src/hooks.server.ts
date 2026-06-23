import { verifyToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import {
    ENABLE_SOCIAL,
    ENABLE_SLEEP,
    SOCIAL_PAGE_PREFIXES,
    SOCIAL_API_PREFIXES,
    SLEEP_PAGE_PREFIXES
} from '$lib/features';

// Skip auth check for static assets
const SKIP_AUTH_PATHS = ['/favicon.ico', '/_app', '/manifest.json', '/robots.txt'];

// Routes gated behind disabled feature flags. Pages redirect home; APIs 404.
function guardDisabledFeatures(pathname: string): Response | null {
    const matches = (prefixes: string[]) =>
        prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));

    if (!ENABLE_SOCIAL) {
        if (matches(SOCIAL_PAGE_PREFIXES)) throw redirect(302, '/');
        if (matches(SOCIAL_API_PREFIXES)) return new Response('Not found', { status: 404 });
    }
    if (!ENABLE_SLEEP && matches(SLEEP_PAGE_PREFIXES)) throw redirect(302, '/');
    return null;
}

export const handle: Handle = async ({ event, resolve }) => {
    // Handle ngrok forwarded headers (dev tunnels only). In production these
    // headers are set by the platform proxy and must not be trusted from the
    // client, otherwise event.url can be poisoned (host-header injection).
    if (dev) {
        const forwardedProto = event.request.headers.get('x-forwarded-proto');
        const forwardedHost = event.request.headers.get('x-forwarded-host');

        if (forwardedProto && forwardedHost) {
            const originalUrl = event.url;
            event.url = new URL(
                originalUrl.pathname + originalUrl.search,
                `${forwardedProto}://${forwardedHost}`
            );
        }
    }

    // Skip auth for static assets
    if (SKIP_AUTH_PATHS.some(p => event.url.pathname.startsWith(p))) {
        return resolve(event);
    }

    // Block routes whose feature flag is off (kept in codebase, hidden from prod).
    const gated = guardDisabledFeatures(event.url.pathname);
    if (gated) return gated;

    const token = event.cookies.get('session');

    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            try {
                const [result] = await db.select({
                    user: users,
                    profile: profiles
                })
                    .from(users)
                    .leftJoin(profiles, eq(users.id, profiles.userId))
                    .where(eq(users.id, payload.userId));

                if (result) {
                    event.locals.user = {
                        id: result.user.id,
                        email: result.user.email,
                        displayName: result.profile?.displayName || null,
                        avatarUrl: result.profile?.avatarUrl || null,
                        role: (result.user.role ?? 'user') as 'user' | 'admin',
                    };
                } else {
                    event.locals.user = null;
                }
            } catch (e) {
                console.error(`[${event.url.pathname}] Auth error:`, e);
                event.locals.user = null;
            }
        } else {
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    return resolve(event);
};
