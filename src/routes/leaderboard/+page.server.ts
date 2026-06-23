import { getTopMeditators } from '$lib/server/queries';

export async function load({ locals }) {
    const leaderboard = await getTopMeditators(100);

    return {
        leaderboard,
        currentUserId: locals.user?.id
    };
}
