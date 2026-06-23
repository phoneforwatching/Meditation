import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// The VAPID public key is safe to expose; the client needs it to subscribe.
export const GET: RequestHandler = async () => {
    return json({ publicKey: env.VAPID_PUBLIC_KEY ?? null });
};
