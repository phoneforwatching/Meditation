import { db } from '$lib/server/db';
import { meditationSessions } from '$lib/server/schema';
import { redirect, fail } from '@sveltejs/kit';

export const actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) throw redirect(302, '/login');

        const data = await request.formData();
        const duration = Number(data.get('duration'));
        const type = String(data.get('type'));
        const mood = Number(data.get('mood')) || null;
        const notes = String(data.get('notes') || '');

        if (!duration || duration <= 0) {
            return fail(400, { error: 'Duration must be positive' });
        }

        await db.insert(meditationSessions).values({
            userId: locals.user.id,
            durationMinutes: duration,
            sessionType: type,
            moodRating: mood,
            notes,
        });

        throw redirect(303, '/');
    }
};
