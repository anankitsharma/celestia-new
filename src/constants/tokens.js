// Design tokens — single source of truth for radius + opacity scales.
// Derived from `plan/competitive-audit/04-gaps-and-opportunities.md` Gap 5.
//
// Use these everywhere instead of inline values to prevent the drift that
// existed before tokens (border radius was 12 / 14 / 16 / 18 / 24 / 36
// across the codebase; gold opacity was 0.06 / 0.08 / 0.12 / 0.15 / 0.18 /
// 0.22 / 0.32 / 0.55 — confusing to design and read).

export const RADIUS = {
  sm: 8,     // chips, small buttons, freeze-stat cells
  md: 14,    // cards (default), modals on small screens
  lg: 24,    // hero corners, fullscreen modals, top-level container chrome
  pill: 999, // toggles, segmented controls, big CTAs (when round)
};

export const OPACITY = {
  // Gold-accent layers (use against navy or cream background).
  // Pick the intensity that matches the visual role.
  subtle:   0.06, // subtle background fill (e.g. soft card bg)
  border:   0.18, // standard 1px borders on accent surfaces
  emphasis: 0.32, // strong borders, hover states, primary surfaces
  text:     0.55, // text-weight accent (use for body-secondary in gold)
};

// Convenience: gold accent at each opacity level. Avoids inline rgba() strings.
// Use as: backgroundColor: GOLD_ALPHA.subtle, borderColor: GOLD_ALPHA.border
export const GOLD_ALPHA = {
  subtle:   'rgba(200,168,75,0.06)',
  border:   'rgba(200,168,75,0.18)',
  emphasis: 'rgba(200,168,75,0.32)',
  text:     'rgba(200,168,75,0.55)',
};

// Kicker tracking — letter-spacing for ALL-CAPS section labels.
// Audit found inline values 1 / 1.5 / 1.6 / 1.8 / 2 used inconsistently.
// One canonical value per Gap 4 in plan/design-audit/03-typography-audit.md.
// Use on every kicker (`PRO INSIGHT`, `WELCOME TO PRO`, `YOUR FIRST 7 DAYS`,
// section labels). Pair with fontFamily: FONTS.sansSemiBold + uppercase.
export const KICKER_TRACKING = 1.6;

// Spacing scale — 4-base modular system.
// Audit found 28 distinct spacing values across HomeScreen alone. Consolidate
// to 8 values, all multiples of 4. Per plan/design-audit/04-hierarchy-and-layout.md.
//
//   xxs (4)  — chip gap, icon-to-label
//   xs  (8)  — within tightly-grouped items
//   sm  (12) — card content gap, button padding
//   md  (16) — card padding (default), section spacing
//   lg  (24) — between major sections, modal padding
//   xl  (32) — between unrelated content blocks
//   xxl (48) — vertical breathing space at section boundaries
//   hero (64)— top-of-screen hero spacing
//
// Migration: replace inline `padding: 14` / `margin: 12` etc. with these tokens
// where they map cleanly. Do NOT force every value — preserve intentional
// non-grid spacing (e.g., the 26pt h1 line-height pairing).
export const SPACING = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  hero: 64,
};

// Type scale — modular 1.25 ratio, base 14pt body.
// Audit found 20+ inline fontSize values. Consolidate to 9.
// Each entry pairs fontSize with line-height that respects the ratio
// (~1.4-1.5x for body, ~1.2-1.25x for headings).
// Per plan/design-audit/03-typography-audit.md.
//
//   caption  (11/16) — kickers, very small captions
//   small    (13/19) — secondary text, button labels
//   body     (14/21) — primary body text
//   bodyLg   (16/24) — emphasized body, sub-headings within body
//   h4       (18/24) — card headlines
//   h3       (22/28) — modal headlines
//   h2       (26/32) — page headlines
//   h1       (32/38) — hero headlines (e.g., Welcome to Pro)
//   display  (40/46) — splash / first-launch only
export const TYPE_SCALE = {
  caption: { fontSize: 11, lineHeight: 16 },
  small:   { fontSize: 13, lineHeight: 19 },
  body:    { fontSize: 14, lineHeight: 21 },
  bodyLg:  { fontSize: 16, lineHeight: 24 },
  h4:      { fontSize: 18, lineHeight: 24 },
  h3:      { fontSize: 22, lineHeight: 28 },
  h2:      { fontSize: 26, lineHeight: 32 },
  h1:      { fontSize: 32, lineHeight: 38 },
  display: { fontSize: 40, lineHeight: 46 },
};

// Motion timing scale — used for animation durations + transitions.
// Audit found durations from 200/300/400/500/600/800/1200ms used ad-hoc.
// Consolidate. Per Gap in plan/design-audit/04-hierarchy-and-layout.md.
export const MOTION = {
  fast: 200,    // toggle, tap response, micro-feedback
  base: 300,    // standard transitions, fade-in
  slow: 500,    // emphasis transitions, success animations
  hero: 800,    // chart reveal shimmer, post-purchase celebration
};

// Interactive state tokens — disabled / focus / loading.
// Codifies the visual treatment for non-default states. Audit found ad-hoc
// opacity 0.5 in places + no visible focus ring (accessibility gap) + no
// standard loading-spinner spec. Per plan/design-audit/02-color-audit.md +
// 04-hierarchy-and-layout.md.
//
// Usage:
//   - disabled: button/touch opacity when disabled (style: { opacity: STATE.disabled })
//   - focus.ringColor: visible focus ring color for keyboard nav (use as borderColor on a
//     focus-state pseudo-border or as react-native-keyboard-controller focus indicator)
//   - focus.ringWidth: standard focus ring thickness
//   - loading.color: ActivityIndicator + spinner default color (gold)
//   - loading.size: standard loading spinner size
export const STATE = {
  disabled: 0.45,                                  // opacity for disabled controls
  focus: {
    ringColor: 'rgba(200,168,75,0.55)',            // gold @ text-weight = visible against most bg
    ringWidth: 2,
    ringRadius: 12,                                // matches button + card radius family
  },
  loading: {
    color:  '#C8A84B',                             // T.gold — branded spinner
    size:   'small',                               // 'small' | 'large' per platform default
  },
};
