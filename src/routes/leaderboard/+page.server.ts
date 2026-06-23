import { getTopMeditators, getWeeklyMeditators } from '$lib/server/queries';

export async function load({ locals }) {
    const [allTime, weekly] = await Promise.all([
        getTopMeditators(100),
        getWeeklyMeditators(100),
    ]);

    return {
        allTime,
        weekly,
        currentUserId: locals.user?.id
    };
}
