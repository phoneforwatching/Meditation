import { db } from '$lib/server/db';
import { meditationSessions, profiles } from '$lib/server/schema';
import { redirect, fail } from '@sveltejs/kit';
import { broadcastNotification } from '$lib/server/notifications';
import { eq } from 'drizzle-orm';

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

        // Broadcast Notification
        const [userProfile] = await db.select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.userId, locals.user.id));

        const userName = userProfile?.displayName || 'Someone';

        await broadcastNotification(
            locals.user.id,
            'activity',
            'Meditation Complete',
            `${userName} completed a ${duration} min meditation!`,
            '/'
        );

        throw redirect(303, '/');
    }
};
