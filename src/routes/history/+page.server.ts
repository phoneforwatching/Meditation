import { db } from '$lib/server/db';
import { meditationSessions } from '$lib/server/schema';
import { and, desc, eq, gt, isNotNull, gte, lte, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
    if (!locals.user) {
        throw redirect(302, '/login');
    }

    const type = (url.searchParams.get('type') || '').trim();
    const start = (url.searchParams.get('start') || '').trim();
    const end = (url.searchParams.get('end') || '').trim();
    const min = Number(url.searchParams.get('min') || 0);
    const max = Number(url.searchParams.get('max') || 0);

    const baseConditions = [
        eq(meditationSessions.userId, locals.user.id),
        gt(meditationSessions.durationMinutes, 0),
        isNotNull(meditationSessions.completedAt)
    ];

    const filterConditions = [...baseConditions];

    if (type && type !== 'all') {
        filterConditions.push(eq(meditationSessions.sessionType, type));
    }
    const startDate = start ? new Date(`${start}T00:00:00.000Z`) : null;
    const endDate = end ? new Date(`${end}T23:59:59.999Z`) : null;
    if (startDate && !Number.isNaN(startDate.getTime())) {
        filterConditions.push(gte(meditationSessions.completedAt, startDate));
    }
    if (endDate && !Number.isNaN(endDate.getTime())) {
        filterConditions.push(lte(meditationSessions.completedAt, endDate));
    }
    if (min > 0) {
        filterConditions.push(gte(meditationSessions.durationMinutes, min));
    }
    if (max > 0) {
        filterConditions.push(lte(meditationSessions.durationMinutes, max));
    }

    const [sessions, sessionTypeRows, totalRows] = await Promise.all([
        db.select({
            id: meditationSessions.id,
            sessionType: meditationSessions.sessionType,
            durationMinutes: meditationSessions.durationMinutes,
            moodRating: meditationSessions.moodRating,
            notes: meditationSessions.notes,
            completedAt: meditationSessions.completedAt,
        })
            .from(meditationSessions)
            .where(and(...filterConditions))
            .orderBy(desc(meditationSessions.completedAt)),
        db.selectDistinct({
            sessionType: meditationSessions.sessionType
        })
            .from(meditationSessions)
            .where(and(...baseConditions))
            .orderBy(meditationSessions.sessionType),
        db.select({
            count: sql<number>`COUNT(*)`
        })
            .from(meditationSessions)
            .where(and(...baseConditions))
    ]);

    const sessionTypes = sessionTypeRows
        .map(row => row.sessionType)
        .filter((sessionType): sessionType is string => Boolean(sessionType));
    const totalSessions = Number(totalRows[0]?.count ?? 0);

    return {
        sessions,
        sessionTypes,
        totalSessions,
        filters: {
            type: type || 'all',
            start,
            end,
            min: min > 0 ? String(min) : '',
            max: max > 0 ? String(max) : ''
        },
        hasActiveFilters: Boolean(
            (type && type !== 'all') ||
            start ||
            end ||
            min > 0 ||
            max > 0
        )
    };
}
