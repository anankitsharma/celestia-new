// V1.x burgundy theme — primary token name kept (`navy`) for backward compat;
// only the value changes. Burgundy moves Celestia out of the cosmic-navy lane
// every direct astrology competitor occupies.
//
// V1.2 — Light Liquid Glass refresh: heroes are no longer dark gradient slabs.
// The cream canvas dominates; burgundy is reserved for actions/pills/key accents.
// New tokens (clay, brass, signalHue, hairline) drive the lighter hero pattern.
// Legacy tokens (navy, navyMid, navyLt, gold, goldLt, cream, warm) are kept for
// any deep-mode surfaces that haven't migrated yet.
export const T = {
  // Legacy / deep surfaces (kept for back-compat)
  navy:    "#3A1A28",
  navyMid: "#5A2840",
  navyLt:  "#7A2840",
  gold:    "#C8A84B",
  goldLt:  "#E2C46A",
  goldDim: "rgba(200,168,75,0.12)",
  cream:   "#FAF8F2",
  warm:    "#F3EDE2",
  stone:   "#97907F",
  ink:     "#2A2418",
  border:  "#EAE3D6",
  white:   "#FFFFFF",

  // Light Liquid Glass tokens
  canvas:      "#FAF8F2",  // page background
  surface:     "#FFFFFF",  // card surface (sits on canvas)
  surfaceWarm: "#F6F1E7",  // warm ivory secondary surface (heroes)
  clay:        "#5C2434",  // softened burgundy — primary action, pills
  clayDeep:    "#3A1A28",  // original burgundy — for high-contrast moments only
  brass:       "#B89968",  // softened gold — accents, milestones
  inkDim:      "#6E5E64",  // muted text on light surfaces
  inkSoft:     "#9B8E8F",  // very muted text (timestamps, hints)
  hairline:    "rgba(42,36,24,0.08)",  // thin separators on light
  glow:        "rgba(92,36,52,0.06)",  // subtle clay wash for hero backgrounds
};

// Per-tab signal hue — subtle wash behind the hero title.
// Used at 10–14% opacity over T.surfaceWarm so each tab feels distinct
// without breaking the light-mode aesthetic.
export const SIGNAL = {
  today:       "#E8C4B8",  // warm rose
  connections: "#D4B5C4",  // mauve-clay
  ask:         "#E8D4A8",  // champagne
  profile:     "#C8C0B0",  // slate-cream
  sky:         "#C4D0D8",  // soft pewter (TransitsScreen)
  chart:       "#D8CDB8",  // parchment (ChartScreen)
  journey:     "#D6C4B0",  // sand (JourneyScreen)
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
