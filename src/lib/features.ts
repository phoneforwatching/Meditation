// Feature flags — declutter the surface area while pre-PMF.
//
// The social layer (community feed, leaderboard, 1:1 chat, nudges) and sleep
// tracking are kept in the codebase but gated off until the core solo loop
// proves retention. Flip a flag to true to bring a feature back into the
// navigation and route surface — no other change required (see hooks.server.ts
// for the central route guard and +layout.svelte for the nav).
//
// Gate to re-open social: WAU >= 50 and D7 retention >= 25% (see FEATURE_PLAN.md).

export const ENABLE_SOCIAL = false; // community, leaderboard, chat, nudge, profiles, notifications
export const ENABLE_SLEEP = false; // sleep tracking vertical (currently unreachable in UI)

// Page route prefixes gated behind each flag. Direct navigation to these while
// the flag is off redirects home; matching API prefixes return 404.
export const SOCIAL_PAGE_PREFIXES = ['/community', '/leaderboard', '/chat', '/profile'];
export const SOCIAL_API_PREFIXES = ['/api/nudge', '/api/messages', '/api/community'];
export const SLEEP_PAGE_PREFIXES = ['/sleep'];
