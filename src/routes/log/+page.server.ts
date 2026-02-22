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

        // Update total minutes
        const [currentProfile] = await db.select({ totalMinutes: profiles.totalMinutes })
            .from(profiles)
            .where(eq(profiles.userId, locals.user.id));

        const newTotal = (currentProfile?.totalMinutes || 0) + duration;

        await db.update(profiles)
            .set({ totalMinutes: newTotal })
            .where(eq(profiles.userId, locals.user.id));

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

        const redirectParams = new URLSearchParams({
            logged: '1',
            minutes: String(duration)
        });
        throw redirect(303, `/?${redirectParams.toString()}`);
    }
};
