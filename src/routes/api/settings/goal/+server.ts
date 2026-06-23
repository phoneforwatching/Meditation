import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// Persist the user's daily meditation goal (minutes). Used by onboarding and
// could back a settings control later.
export async function POST({ request, locals }) {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const minutes = Number(body?.dailyGoalMinutes);

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
        return json({ error: 'dailyGoalMinutes must be between 1 and 120' }, { status: 400 });
    }

    await db.update(profiles)
        .set({ dailyGoalMinutes: Math.round(minutes) })
        .where(eq(profiles.userId, locals.user.id));

    return json({ success: true });
}
