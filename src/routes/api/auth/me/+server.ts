import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
    if (!locals.user) {
        return json({ user: null });
    }
    return json({ user: locals.user });
}
