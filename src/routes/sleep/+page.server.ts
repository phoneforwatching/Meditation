import { db } from '$lib/server/db';
import { sleepLogs } from '$lib/server/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');

    // Fetch last 7 days of sleep logs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await db.select()
        .from(sleepLogs)
        .where(eq(sleepLogs.userId, locals.user.id))
        .orderBy(desc(sleepLogs.bedtime));

    return {
        recentLogs,
        user: locals.user
    };
};

export const actions = {
    log: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const bedtimeStr = data.get('bedtime')?.toString();
        const wakeTimeStr = data.get('wakeTime')?.toString();

        if (!bedtimeStr || !wakeTimeStr) {
            return fail(400, { error: 'Missing times' });
        }

        const bedtime = new Date(bedtimeStr);
        const wakeTime = new Date(wakeTimeStr);

        if (wakeTime <= bedtime) {
            return fail(400, { error: 'Wake time must be after bedtime' });
        }

        const durationMinutes = Math.round((wakeTime.getTime() - bedtime.getTime()) / (1000 * 60));

        // Calculate quality score (simple logic for now)
        // 7-9 hours (420-540 mins) = 5
        // 6-7 or 9-10 hours = 4
        // <6 or >10 = 3
        let quality = 3;
        if (durationMinutes >= 420 && durationMinutes <= 540) quality = 5;
        else if ((durationMinutes >= 360 && durationMinutes < 420) || (durationMinutes > 540 && durationMinutes <= 600)) quality = 4;

        await db.insert(sleepLogs).values({
            userId: locals.user.id,
            bedtime,
            wakeTime,
            durationMinutes,
            quality
        });

        return { success: true };
    },

    delete: async ({ request, locals }) => {
        if (!locals.user) return fail(401, { error: 'Unauthorized' });

        const data = await request.formData();
        const id = Number(data.get('id'));

        if (!id) return fail(400, { error: 'Missing ID' });

        // Delete specific sleep log by ID and ensure user owns it
        await db.delete(sleepLogs)
            .where(
                and(
                    eq(sleepLogs.id, id),
                    eq(sleepLogs.userId, locals.user.id)
                )
            );

        return { success: true };
    }
};
