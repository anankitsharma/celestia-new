export const T = {
  // V1.2 burgundy migration (phase 5): `navy` value flipped cosmic → burgundy.
  // Token name kept for backward compat — every existing T.navy callsite now
  // renders as deep burgundy ink/accent on cream, matching the new aesthetic.
  navy:    "#3A1A28",
  navyMid: "#5A2840",
  navyLt:  "#7A2840",
  // gold — accent color. Contrast vs cream is 3.1:1 (AA Large only, ≥18pt).
  // RULE: body-sized text (<18pt) on cream MUST NOT use T.gold. Use either:
  //   • larger size (≥18pt) — passes AA Large
  //   • a darker variant (`goldText` below) — passes AA at body size
  //   • colors.text instead — body text shouldn't lean on the accent anyway
  // T.gold on dark backgrounds (navy, plum cards, gradients) is fine — it's
  // ~7:1 there. The watch-out is the light-mode cream.
  gold:    "#C8A84B",
  goldLt:  "#E2C46A",
  goldDim: "rgba(200,168,75,0.12)",
  // goldText — darker gold variant safe for body text on cream (5.0:1, AA pass).
  // Use sparingly — only when gold is tonally required AND the size is <18pt.
  // For most cases, use colors.text or colors.textSecondary instead.
  goldText: "#A07820",
  cream:   "#FAF8F2",
  warm:    "#F3EDE2",
  // stone — secondary text. Tuned to pass WCAG AA on BOTH cream (#FAF8F2 →
  // 4.5:1) AND dark navy (#0F0E1A → 4.6:1). Was #97907F (3.0:1 on cream =
  // AA fail). Darkening fixes 150+ direct T.stone usages without per-site
  // refactor. See plan/design-audit/02-color-audit.md.
  stone:   "#7E776A",
  ink:     "#2A2418",
  border:  "#EAE3D6",
  white:   "#FFFFFF",

  // ── V1.2 Light Liquid Glass tokens (additive, phase 1 of theme migration) ──
  // Heroes will move from dark gradient slabs to a cream canvas with subtle
  // burgundy/clay accents. New code should prefer these tokens; legacy
  // navy/gold/cream/warm remain untouched until phase 5.
  canvas:      "#FAF8F2",  // page background (alias of cream for clarity)
  surface:     "#FFFFFF",  // card surface that sits on canvas
  surfaceWarm: "#F6F1E7",  // warm ivory secondary surface (light heroes)
  clay:        "#5C2434",  // softened burgundy — primary action, pills
  clayDeep:    "#3A1A28",  // deep burgundy — high-contrast moments / modals
  brass:       "#B89968",  // softened gold — accents, milestones
  inkDim:      "#6E5E64",  // muted text on light surfaces
  inkSoft:     "#9B8E8F",  // very muted text (timestamps, hints)
  hairline:    "rgba(42,36,24,0.08)",  // thin separators on light
  glow:        "rgba(92,36,52,0.06)",  // subtle clay wash for hero backgrounds
};

// Per-tab signal hue — subtle wash behind the hero title.
// Used at 10–14% opacity over T.surfaceWarm so each tab feels distinct
// without breaking the light-mode aesthetic. Phase 6 wires these up.
export const SIGNAL = {
  today:       "#E8C4B8",  // warm rose
  connections: "#D4B5C4",  // mauve-clay (Circle / Compatibility)
  ask:         "#E8D4A8",  // champagne (Chat)
  profile:     "#C8C0B0",  // slate-cream
  sky:         "#C4D0D8",  // soft pewter (Transits)
  chart:       "#D8CDB8",  // parchment
  journey:     "#D6C4B0",  // sand (Reports / Journey)
};

export const FONTS = {
  serif: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifMedium: 'PlayfairDisplay_500Medium',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  sans: 'DMSans_400Regular',
  sansLight: 'DMSans_300Light',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
};
