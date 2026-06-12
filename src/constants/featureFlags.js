// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA — FEATURE FLAGS
// ─────────────────────────────────────────────────────────────────────────────

// AUTH_ENABLED — master switch for account sign-in / cloud sync.
//
// Temporarily DISABLED while Google Sign-In is suspended by Google. The app is
// local-first (SQLite is the source of truth), so it runs fully without an
// account: onboarding collects the user's name + birth data and saves the
// profile locally. Sign-in only ever added optional cloud backup/sync.
//
// To re-enable accounts later: flip this back to `true`. Every sign-in entry
// point (Splash, Profile, post-onboarding) is gated on this flag, so no other
// code changes are needed.
export const AUTH_ENABLED = false;
