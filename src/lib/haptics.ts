export function vibrate(ms: number | number[] = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
    }
}

export const HAPTIC_PATTERNS = {
    TAP: 10,
    SUCCESS: [50, 30, 50],
    WARNING: [30, 50, 30],
    TIMER_COMPLETE: [500, 200, 500, 200, 1000]
};
