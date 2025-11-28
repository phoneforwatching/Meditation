export type AchievementId =
    | 'streak_3'
    | 'streak_7'
    | 'streak_14'
    | 'streak_30'
    | 'time_60'
    | 'time_300'
    | 'time_1000'
    | 'time_5000'
    | 'sessions_10'
    | 'sessions_50'
    | 'sessions_100';

type AchievementType = 'streak' | 'time' | 'sessions';

export type AchievementDefinition = {
    id: AchievementId;
    type: AchievementType;
    threshold: number;
    icon: string;
};

export type AchievementStatus = AchievementDefinition & {
    achieved: boolean;
    current: number;
    progress: number; // 0-1
};

export type AchievementStats = {
    streak: number;
    totalMinutes: number;
    totalSessions: number;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
    { id: 'streak_3', type: 'streak', threshold: 3, icon: '✨' },
    { id: 'streak_7', type: 'streak', threshold: 7, icon: '🔥' },
    { id: 'streak_14', type: 'streak', threshold: 14, icon: '🏮' },
    { id: 'streak_30', type: 'streak', threshold: 30, icon: '🌟' },
    { id: 'time_60', type: 'time', threshold: 60, icon: '🕰️' },
    { id: 'time_300', type: 'time', threshold: 300, icon: '🌅' },
    { id: 'time_1000', type: 'time', threshold: 1000, icon: '🧘' },
    { id: 'time_5000', type: 'time', threshold: 5000, icon: '🏔️' },
    { id: 'sessions_10', type: 'sessions', threshold: 10, icon: '🌱' },
    { id: 'sessions_50', type: 'sessions', threshold: 50, icon: '🌿' },
    { id: 'sessions_100', type: 'sessions', threshold: 100, icon: '🌲' },
];

function getCurrentForType(type: AchievementType, stats: AchievementStats) {
    if (type === 'streak') return stats.streak;
    if (type === 'time') return stats.totalMinutes;
    return stats.totalSessions;
}

export function evaluateAchievements(stats: AchievementStats): AchievementStatus[] {
    return ACHIEVEMENTS.map((achievement) => {
        const current = getCurrentForType(achievement.type, stats);
        const progress = Math.min(1, Math.max(0, current / achievement.threshold));

        return {
            ...achievement,
            achieved: current >= achievement.threshold,
            current,
            progress,
        };
    });
}

export function splitAchievements(statuses: AchievementStatus[]) {
    return {
        unlocked: statuses.filter((a) => a.achieved),
        locked: statuses.filter((a) => !a.achieved),
    };
}
