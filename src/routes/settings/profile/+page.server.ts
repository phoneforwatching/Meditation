import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
    if (!locals.user) {
        throw redirect(303, '/login');
    }

    const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, locals.user.id)
    });

    return {
        profile: profile || { displayName: locals.user.displayName, bio: '', avatarUrl: null }
    };
}
