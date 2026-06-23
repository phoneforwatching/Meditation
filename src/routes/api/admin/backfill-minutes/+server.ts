import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'admin') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Recompute total_minutes for every profile in a single statement
    // instead of N+1 (one SELECT + one UPDATE per user).
    await db.execute(sql`
        UPDATE profiles p
        SET total_minutes = COALESCE((
            SELECT SUM(m.duration_minutes)
            FROM meditation_sessions m
            WHERE m.user_id = p.user_id
        ), 0)
    `);

    return json({ success: true });
};
