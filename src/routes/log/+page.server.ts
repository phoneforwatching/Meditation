import { db } from '$lib/server/db';
import { meditationSessions, profiles } from '$lib/server/schema';
import { redirect, fail } from '@sveltejs/kit';
import { broadcastNotification } from '$lib/server/notifications';
import { eq, sql } from 'drizzle-orm';

export const actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) throw redirect(302, '/login');

        const data = await request.formData();
        const duration = Number(data.get('duration'));
        const type = String(data.get('type'));
        const mood = Number(data.get('mood')) || null;
        const notes = String(data.get('notes') || '');
        const tags = String(data.get('tags') || '');

        if (!duration || duration <= 0) {
            return fail(400, { error: 'Duration must be positive' });
        }

        await db.insert(meditationSessions).values({
            userId: locals.user.id,
            durationMinutes: duration,
            sessionType: type,
            moodRating: mood,
            notes,
            tags: tags || null,
        });

        // Atomically increment total minutes (avoids a read-modify-write race
        // when sessions are logged concurrently) and read the display name in
        // the same statement.
        const [updated] = await db.update(profiles)
            .set({ totalMinutes: sql`${profiles.totalMinutes} + ${duration}` })
            .where(eq(profiles.userId, locals.user.id))
            .returning({ displayName: profiles.displayName });

        const userName = updated?.displayName || 'Someone';

        // Fire-and-forget: don't block the redirect on a fan-out write.
        void broadcastNotification(
            locals.user.id,
            'activity',
            'Meditation Complete',
            `${userName} completed a ${duration} min meditation!`,
            '/'
        ).catch((e) => console.error('broadcastNotification failed:', e));

        const redirectParams = new URLSearchParams({
            logged: '1',
            minutes: String(duration)
        });
        throw redirect(303, `/?${redirectParams.toString()}`);
    }
};
