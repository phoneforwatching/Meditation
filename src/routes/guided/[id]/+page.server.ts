import { redirect, error } from '@sveltejs/kit';
import { getGuidedSession } from '$lib/guided';

export function load({ locals, params }) {
    if (!locals.user) {
        throw redirect(302, '/login');
    }
    const session = getGuidedSession(params.id);
    if (!session) {
        throw error(404, 'Guided session not found');
    }
    return { session };
}
