import { db } from '$lib/server/db';
import { dailyCheckins } from '$lib/server/schema';
import { desc, gte } from 'drizzle-orm';
import { getTopMeditators } from '$lib/server/queries';

export async function load({ locals }) {
    // Get 24 hours ago timestamp
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const usersData = await getTopMeditators(50);

    // Fetch active check-ins (last 24h)
    const activeCheckins = await db.select()
        .from(dailyCheckins)
        .where(gte(dailyCheckins.createdAt, oneDayAgo))
        .orderBy(desc(dailyCheckins.createdAt));

    // Map latest check-in to user
    const checkinMap = new Map();
    for (const checkin of activeCheckins) {
        if (!checkinMap.has(checkin.userId)) {
            checkinMap.set(checkin.userId, checkin);
        }
    }

    const leaderboard = usersData.map(user => {
        const checkin = checkinMap.get(user.id);
        return {
            ...user,
            checkinPhoto: checkin?.photoUrl,
            checkinMood: checkin?.mood,
            checkinCaption: checkin?.caption
        };
    });

    return {
        leaderboard,
        currentUserId: locals.user?.id
    };
}
