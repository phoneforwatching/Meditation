import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'breathe-theme';

/**
 * The user's saved preference (independent of route-forced themes).
 * Light-first: the app's non-sleep pages are styled light-only, so dark is an
 * explicit opt-in — we deliberately do NOT auto-adopt the OS dark preference.
 */
function readPreference(): Theme {
	if (!browser) return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'dark' ? 'dark' : 'light';
}

/** Effective theme — what's actually rendered. Drives the `.dark` class. */
export const theme = writable<Theme>(readPreference());

theme.subscribe((value) => {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', value === 'dark');
});

/** User-initiated theme change — persists as the new preference. */
export function toggleTheme() {
	theme.update((current) => {
		const next: Theme = current === 'light' ? 'dark' : 'light';
		if (browser) localStorage.setItem(STORAGE_KEY, next);
		return next;
	});
}

export function setTheme(value: Theme) {
	if (browser) localStorage.setItem(STORAGE_KEY, value);
	theme.set(value);
}

/**
 * Apply a route-scoped theme without touching the saved preference.
 * e.g. `/sleep` forces dark; leaving it restores the user's preference.
 */
export function applyRouteTheme(forceDark: boolean) {
	theme.set(forceDark ? 'dark' : readPreference());
}
