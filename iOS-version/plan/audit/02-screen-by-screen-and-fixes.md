# 02 — Screen-by-Screen Review + Action Plan

Each screen reviewed against:
1. **Apple HIG / iOS conventions**
2. **Audience expectations** (women 18-30, astrology-curious)
3. **Visual consistency / design system**
4. **Accessibility (VoiceOver, Dynamic Type)**

---

## SPLASH SCREEN

### What it has
- Full-screen `LinearGradient` `#1A0A55 → #0E0E22 → #07070F`
- Animated gold orb with 3 concentric rings (one ring rotates clockwise, one CCW)
- Wordmark `CELESTIA` in serif uppercase, letterspacing 10
- Tagline `UNDERSTAND THE PEOPLE YOU LOVE`
- Single CTA `Map My People` (gold pill button)

### Verdict
✅ **9/10.** Brand-establishing, on-tone for audience. Reviewer sees this and immediately reads "premium app." The animated orb is a craft signal — audience perceives quality.

### Issues
- ⚠️ Orb animation runs unconditionally (battery concern if app is left on splash long; minor)
- ⚠️ No accessibilityLabel on the CTA — VoiceOver users hear "button" only

### Fixes
- Add `accessibilityLabel="Begin onboarding"` to the CTA
- (Skip orb battery — splash is short-lived)

---

## ONBOARDING (12 steps)

### Pacing
12 screens at avg 8 seconds each = ~90 seconds total. Tight enough.

### Per-step audit

| # | Step | Verdict | Issues |
|---|---|---|---|
| 1 | Hook — "Every relationship has a pattern" | ✅ | Add accessibility roles |
| 2 | Pattern in love (4 options) | ✅ | OptionCard tap targets ~80pt height ✓ |
| 3 | Communication when triggered (4 options) | ✅ | Same as 2 |
| 4 | Depth ("How well understood?") | ✅ | Same |
| 5 | Framework citation (3 cards) | ✅ | Static — no interactivity. Heading role missing |
| 6 | Birth date + name | ⚠️ | DateTimePicker uses iOS native — VoiceOver-friendly |
| 7 | Birth time (optional) | ✅ | Skip option clear |
| 8 | Birth place (optional) | ✅ | Skip option clear; city autocomplete |
| 9 | Calculating | ✅ | Static loader; needs `accessibilityLiveRegion="polite"` for phase changes |
| 10 | First Hit (attachment + Venus) | ✅ | Reveal text ~22pt — large enough |
| 11 | Big Reveal (3 tiles + chart toggle) | ✅ | "See the details" link clear |
| 12 | Connections add prompt | ✅ | Skip clear |

### Issues across onboarding
1. Progress bar — no accessibilityLabel announcing "Step X of 11"
2. Back button (~40 × 40pt) — borderline 44pt. Bump to 44 × 44pt.
3. Continue / option-card taps — no accessibilityRole / hint

### Fixes (priority order)

| Fix | Effort |
|---|---|
| Add `accessibilityRole="button"` + `accessibilityLabel` to OptionCard, GoldButton, Back button | 30 min |
| Add `accessibilityRole="header"` to step h1 | 10 min |
| Bump back-button hit area to 44pt | 10 min |
| Add `accessibilityValue={{ now: step, min: 1, max: 12 }}` to ProgressBar with `accessibilityRole="progressbar"` | 15 min |

---

## TODAY tab

### Sections rendered (in order)

1. Hero (greeting + name + avatar + streak strip + period tabs)
2. Eclipse Season banner (rare, conditional)
3. **Daily Reflection prompt** ✅
4. **Quick-add connection** ✅
5. **Drift Alert** ✅
6. Navigator Briefing card (today's theme + Share button)
7. Birthday Solar Return (rare, conditional)
8. Right Now card (Today's Energy chip + CTA)
9. Previously On
10. Journal card
11. Evening Reflection (after 6pm)
12. Sunday Week Reflection (Sundays)
13. New Insight Unlocked (drip-feed)
14. Daily Quests
15. Next Badge progress
16. Time-adaptive prompts
17. Promo card

### Verdict
🟡 **7/10.** A lot of content. Some redundancy between sections (Reflection prompt, Evening Reflection, Sunday Reflection are all reflection moments). After the cleanup it's not horoscope-coded but it IS dense.

### Issues
1. **Density.** PDF says Today should be 5 sections. We have 12-17 conditional sections. Reviewer scrolling might think "this app is doing a lot."
2. **Section labels mixed case.** Some sections are uppercase letterspaced (`DAILY REFLECTION`, `RIGHT NOW`, `YOUR STORY`), others are sentence-case (`Today's Energy`). Pick one.
3. **Hero greeting + name + avatar** — large area. Audience-loved. But heroName is `firstName.split(' ')[0]` — what if name has special chars? Edge case.
4. **No accessibilityHeader for h1.** Screen reader users have no quick-nav to "today's main content."
5. **Share button on Navigator Briefing** — small (8pt padding). Touch target ~30 × 24pt. Below 44pt. Bump.

### Fixes

| Fix | Effort |
|---|---|
| Add `accessibilityRole="header"` to greeting + each section label | 15 min |
| Bump Navigator Briefing share-button hit area: wrap in `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` | 5 min |
| Standardize section labels to UPPERCASE-LETTERSPACED 11pt | 15 min |
| (Optional, defer) Compress Today to 8-10 sections by hiding low-frequency ones | 1 hr — do post-approval |

---

## CONNECTIONS tab

### Sections
1. Hero (greeting + count + add button)
2. Empty state: orbit visualization + relationship-type legend + **prominent gold CTA** (added in Option B)
3. Connections list (when populated)
4. Add modal (relationship type pills + name + DOB)
5. Detail view (when partner selected)

### Verdict
✅ **8.5/10.** Killer feature. Distinctive orbit visualization. 8 relationship types is differentiation no competitor has.

### Issues
1. **Orbit visualization is decorative SVG** — no accessibilityLabel. VoiceOver users see "image" only. Should announce "Empty circle, tap below to add someone."
2. **Relationship-type pills** — taps work, but no accessibilityRole / state.
3. **Add modal birth-time picker** — iOS native, VoiceOver-friendly. ✅
4. **Detail view share button** — already has "Share Result ↗" (good). Touch target ~36pt height. Should be 44pt.
5. **Score circle (SVG)** — no accessibility (just visual). Add label "Connection score 87 out of 100."

### Fixes

| Fix | Effort |
|---|---|
| Add `accessibilityLabel` to orbit visualization (decorative — mark hidden) | 5 min |
| Add `accessibilityRole="button"` + label to each relationship-type pill | 15 min |
| Bump Share-result button hit area | 5 min |
| Add `accessibilityValue={{ now: score, min: 0, max: 100 }}` + role="progressbar" to score circle | 10 min |
| Connections empty state — soften copy from utility ("Add Someone") to invitation ("Who's the first person you want to understand better?") | 10 min |

---

## ASK tab (chat)

### Layout
- Header (back + title + history button)
- Messages list (`ScrollView` with `.map()` over messages — should be `FlatList inverted`)
- Input bar at bottom + suggested-question chips + per-person chips (added in Option B) + AI disclaimer

### Verdict
🟡 **7.5/10.** Functional. AI tone is right (3-part response per V1_OVERRIDE). Per-person chip strip is a clever audience win.

### Issues
1. **Messages render as `.map()` not `FlatList`.** On long chats this causes scroll jank + memory pressure. Fix.
2. **AI bubble** — no accessibilityLabel beyond raw text. Screen reader announces a long paragraph without "AI message" context.
3. **Suggested chip strip** — chips have small text + small padding. Tap target borderline.
4. **Share button on each AI bubble** — small text "Share ↗" no hit-slop. Below 44pt.
5. **Send button** — paper-plane icon only. No accessibilityLabel.
6. **History panel** (overlay) — no focus management when open.

### Fixes

| Fix | Effort |
|---|---|
| Convert messages to `FlatList inverted` with `keyExtractor` | 1 hr |
| Add `accessibilityLabel="Celestia replied: {text}"` for AI bubbles, `"You: {text}"` for user | 15 min |
| Add `accessibilityRole="button"` + `accessibilityLabel="Send message"` to send button | 5 min |
| Add `hitSlop` to Share buttons + suggested chips | 10 min |
| History panel — `accessibilityViewIsModal={true}` + initial focus on first list item | 15 min |

---

## PROFILE tab

### Sections
1. Hero (avatar + name + birth info)
2. Sign badges (`♈ ♉ ♊` — gated by astrology toggle)
3. **Discovery banner** (added in Option B — first 3 visits)
4. Streak / XP / Badges journey strip
5. Share My Profile button
6. Preferences (Voice / Depth / Appearance / Show Astrology toggle)
7. Deep Readings (Reports + optional Chart)
8. PDF 8-section profile blueprint (gated)
9. Legal (Privacy / Terms / Support)
10. App Data (Reset)
11. General

### Verdict
✅ **8/10.** Well-organized, comprehensive. The discovery banner (Option B) solves the "where's my chart?" problem.

### Issues
1. **Avatar** — single letter, gold gradient. Small (~50pt). Decorative only — no accessibilityLabel.
2. **Sign badges** — when gated ON, glyphs show. No accessibilityLabel for the glyphs (`♈` reads as Aries to a sighted user; VoiceOver users hear "ARIES" only if labeled).
3. **Toggle "Show astrology details"** — custom UI not using `Switch` component. Should use accessibilityRole="switch" + accessibilityState.
4. **Discovery banner CTA "Turn on"** — small button. Touch target ~30pt. Bump.
5. **8 PDF sections** — when gated ON, navigate to ChartScreen with `?section={id}` param. Section param isn't currently honored by ChartScreen — needs implementation or the deep-link drops the user at top of Chart.

### Fixes

| Fix | Effort |
|---|---|
| Convert Show Astrology toggle to use `accessibilityRole="switch"` + `accessibilityState={{ checked: showAstrology }}` | 5 min |
| Bump banner "Turn on" button to 44pt height | 5 min |
| Add accessibilityLabel to avatar + decorative-glyph hide | 10 min |
| Implement section-anchor scroll in ChartScreen (or remove the section route param from Profile rows) | 30 min |
| Mark pure-decoration glyphs (☉ ☽ ↑) on Profile rows with `accessibilityElementsHidden` | 5 min |

---

## CHART screen (Profile sub-screen, deep)

### Verdict
✅ **8/10.** Real chart wheel + planet table + house list. Educational tooltips inline. Audience loves this. Apple risk: low (deep-tab, gated).

### Issues
1. **Chart wheel SVG** — pure visual. No accessibility. Mark `accessibilityElementsHidden`.
2. **Planet rows** — should be touchable for deep-dive. Each row needs `accessibilityRole="button"` + label like "Sun in Cancer in 5th house, tap for details."
3. **Tooltip "?" buttons** — small, no labels. "Tap to learn what Sun sign means."

### Fixes

| Fix | Effort |
|---|---|
| Mark chart-wheel SVG accessibility-hidden | 5 min |
| Label all planet/house rows for VoiceOver | 30 min |
| Label all CosmicTooltip "?" buttons | 15 min |

---

## REPORTS screen (Profile sub-screen)

### Verdict
✅ **8.5/10.** Tile grid + clear titles + descriptions. Apple-friendly (no horoscope language post-cleanup). Audience-loved (depth on tap).

### Issues
1. **Report tiles** — large 2-column grid. Tap area ~140 × 180pt. Plenty of touch room. ✅
2. **Tiles need accessibilityRole="button" + label** — "Love Compass report. How you connect — attachment, intimacy, conflict patterns."
3. **Generate-report loading sequence** — phases like "Reading the South Node…" shown for ~5 sec each. Need `accessibilityLiveRegion="polite"`.

### Fixes
| Fix | Effort |
|---|---|
| Tile accessibility labels | 15 min |
| Loading-phase live region | 5 min |

---

## NOTIFICATIONS settings screen

### Verdict
✅ **9/10.** Clean. Channel labels softened post-cleanup. Per-channel toggles.

### Issues
- Toggles use TouchableOpacity, not Switch component. Same `accessibilityRole="switch"` fix as Profile.

### Fixes
| Fix | Effort |
|---|---|
| Switch-role + state for each toggle | 10 min |

---

## JOURNAL screens

### Verdict
✅ **8/10.** Functional. Renamed from "Cosmic Journal."

### Issues
- JournalHistoryScreen renders entries via `.map()`. If user has 100+ entries, perf issue. Convert to FlatList.
- Date headers — no accessibilityRole="header"

### Fixes
| Fix | Effort |
|---|---|
| Convert to FlatList | 30 min |
| Header roles | 5 min |

---

## CONSOLIDATED ACTION PLAN

### Tier 0 — Apple submission blockers (do before EAS build)
| # | Action | File(s) | Effort |
|---|---|---|---|
| 1 | TabBar items: `accessibilityRole="tab"` + `accessibilityLabel={tab.label}` + `accessibilityState={{ selected }}` | TabBar.js | 10 min |
| 2 | Splash CTA: accessibilityLabel | SplashScreen.js | 5 min |
| 3 | Onboarding OptionCard + GoldButton: role + label | OptionCard / GoldButton | 30 min |
| 4 | Onboarding back button: role + 44pt hit area | OnboardingFlowScreen | 10 min |
| 5 | Today: header roles + Share-button hit-slop | HomeScreen | 30 min |
| 6 | Connections: orbit-decoration hidden + pill labels + Share hit-slop | CompatibilityScreen | 30 min |
| 7 | Ask: bubble label + send-btn label + chip hit-slop | ChatScreen | 30 min |
| 8 | Profile: Switch role + banner button hit area | ProfileScreen | 15 min |
| 9 | All decorative emoji/glyph Texts: `accessibilityElementsHidden` | global | 30 min |
| 10 | All h1/section labels: `accessibilityRole="header"` | global | 30 min |
| **Total Tier 0** | | | **~3-4 hr** |

### Tier 1 — Polish (after submission, before launch)
| # | Action | Effort |
|---|---|---|
| 11 | Fix `textMuted` contrast in both modes | 15 min |
| 12 | Bump all `fontSize: 8/9` → 11 | 1 hr |
| 13 | Move body 13pt → 14pt | 30 min |
| 14 | Audit `gold` text — bump to ≥14pt where used as text | 30 min |
| 15 | Convert ChatScreen messages to FlatList inverted | 1 hr |
| 16 | Convert JournalHistory to FlatList | 30 min |
| 17 | Define + apply TYPE / SPACE / RADIUS scales | 2 hr |
| 18 | Section-anchor implementation in ChartScreen | 30 min |
| 19 | Empty state copy softening (Connections, Ask) | 30 min |
| **Total Tier 1** | | **~7 hr** |

### Tier 2 — v1.x design system refactor
| # | Action | Effort |
|---|---|---|
| 20 | Extract Button atom (4 variants) | 2 hr |
| 21 | Extract Chip atom | 1 hr |
| 22 | Extract Card atom | 1 hr |
| 23 | Extract BaseModal | 1 hr |
| 24 | React.memo audit on share cards + heavy components | 1 hr |
| 25 | Dynamic Type support audit | 1 hr |
| **Total Tier 2** | | **~7 hr** |

---

## RECOMMENDATION

**Do Tier 0 (3-4 hr) before EAS build.** Without it, Apple's accessibility check will likely return notes (not a hard reject, but reviewer-quality flags). Adding labels also raises composite design score from 7.0 → 7.8.

**Defer Tier 1 + Tier 2 to post-approval.** They're polish, not blockers. Tier 1 within the first 2 weeks of launch will materially improve the audience experience.

---

## What to NOT do

- **Don't redesign the color palette.** It's working. Cream-gold-navy is the audience win.
- **Don't replace fonts.** Playfair + DM Sans is on-brand and editorial.
- **Don't strip animations.** The orbs / stars are part of the brand. Apple-safe.
- **Don't add Switch components everywhere.** Use the role/state pattern on existing TouchableOpacity-based toggles to keep visual consistency.
- **Don't add Dynamic Type now.** Massive refactor. Defer to v1.x. iOS users with system-large type get a worse experience but not a broken one.
