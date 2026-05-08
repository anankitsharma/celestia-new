# 08 — Design Audit

Scoring our current 13-screen onboarding against:
1. **Refactoring UI** (7-principle framework)
2. **App-onboarding-questionnaire skill** (psychology checklist)
3. **iOS-version reference** (`/iOS-version/src/screens/OnboardingFlowScreen.js`) — same brand, different positioning, different design choices

The iOS-version is **the same Celestia, but framed as a relationship-pattern app** (psychology-led, astrology-supporting). It's a different bet from ours ("your real chart, not your sun sign" — astrology-led). Both can be right; the audit notes which iOS-version choices are *positioning* (don't copy without thinking) vs *craft* (steal directly).

---

## Executive scorecard

| Dimension | Score | Verdict |
|---|---|---|
| Refactoring UI overall | **6.7 / 10** | Solid foundation. Gold overuse and CTA hierarchy are the biggest wins available. |
| Questionnaire skill | **8 / 10** | Strong — bundle / preview / solution-bridge moves all landed. |
| iOS-version craft parity | **5 / 10** | Missing: framework citation, CTA hierarchy, accessibility, opt-in astrology, custom time picker. |

Net: **good but not yet polished.** The structure and copy are excellent. The visual system has one fundamental flaw — gold is overloaded — and a few craft-level gaps the iOS-version already solved.

---

## What the iOS-version got right that we should steal

### 1. Two-tier CTA hierarchy (steal this, high impact)

The iOS-version uses **two distinct primary CTAs**:

| Style | Used for | Visual |
|---|---|---|
| `heroCta` | Hook, calc, reveal, connections-prompt — the *ceremonial* moments | Clay-filled (`T.clay #5C2434`), cream text, NO gradient, soft shadow |
| `GoldButton` | Birth-data form, paywall — the *transactional* moments | Gold gradient, dramatic shadow |

We use `GoldButton` for **every** primary CTA in onboarding. That collapses hierarchy — every screen's CTA looks equally important, which means none of them feel ceremonial.

**Fix:** Add a `HeroCta` component (clay solid) and use it on screens 1 (Hook), 8 (Calc auto-advances anyway), 9 (Active Reveal), 10 (Preview), and the "Set My Morning" CTA on screen 11.

```jsx
// Suggested additions to theme:
heroCta: { width: 292, height: 56, borderRadius: 28, alignItems: 'center',
           justifyContent: 'center', backgroundColor: T.clay,
           shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
           shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },
heroCtaText: { fontFamily: FONTS.sansSemiBold, fontSize: 15,
               color: T.cream, letterSpacing: 0.4 },
```

Reserve `GoldButton` for the paywall and birth-data form. Everywhere else, use `HeroCta`.

### 2. Splash → Hook visual continuity (steal this, high impact)

The iOS-version explicitly mirrors Splash with a `LinearGradient` cream ramp `['#FBF5EA', '#F7F0E2', '#F4ECDB']` + a hairline divider on the Hook. The transition reads as one canvas.

Ours: Hook uses ivory + a glow halo; Splash uses a separate gradient. Two distinct designs colliding at a moment that should feel seamless.

**Fix:** Match Hook gradient to Splash. Add the small hairline divider (`width: 36, height: 1, backgroundColor: 'rgba(92,36,52,0.35)'`) above the headline as a graphic anchor.

### 3. Calculating screen — kill the mystical orb (steal this)

iOS-version comment explicitly says: *"No mystical orb / gold radial glow."* Theirs is just the cream gradient + hairline + title + 4 progressing dots. Cleaner, more credible, less "horoscope app."

Ours has a glowing gold orb + radial halo. It's beautiful but it telegraphs "mystical astrology" instead of "calculating your data."

**Fix:** Strip the orb + glow. Keep the 4-phase loading text + dot progression. Match the rest of the calm cream/clay system.

### 4. Accessibility props (steal this, medium impact)

The iOS-version threads `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, and `accessibilityElementsHidden` through every interactive component. Ours has none.

**Fix:** Add to `OptionCard`, `GoldButton`, the new chip rows, the bundle rows, and the wake-time chips. Roughly +5 LOC per component.

### 5. Custom time picker (consider, medium impact)

The iOS-version wrote `SimpleTimePicker` because the native iOS `DateTimePicker` (wheel style) snaps back to a default near 5:30 if `value` is reapplied during an active AM↔PM scroll. They use `pickerInitialTime` set ONCE + `draftTimeRef` ref + commit only on Done.

Ours uses the native picker and likely hits the same bug. Worth porting their `SimpleTimePicker` component or the `pickerInitialTime` / `draftTimeRef` pattern.

### 6. Skip-with-fallback for city (steal this, low impact)

iOS-version offers a "Skip for now" link below the city CTA that sets `selectedCity` to `{ name: 'Approximate', lat: 0, lng: 0 }`. Reduces friction for users without precise birth-city memory; reviewers see the app isn't strictly demanding birth-city data.

Ours requires a city pick. **Fix:** Add a "Skip for now" link below the gold CTA on step 7.

### 7. `startAt` mid-flow re-entry (consider for v2)

The iOS-version supports `route.params.startAt = 6` to drop a user directly at birth-data when they tap a "Personalize Celestia" placeholder banner from inside the app. The `entryStep` state freezes the back-navigation floor so they can't walk past where they came in.

Not blocking, but a smart pattern for users who skip past a soft-paywall and want to complete their profile later. **Defer to v2.**

---

## What the iOS-version did differently that we should NOT copy

### Positioning — psychology-led vs astrology-led

iOS-version positions Celestia as *"Understand the patterns in your relationships. Why you love who you love."* — Hook framed around behavior, not the chart. Their motivation question is *"What's something you keep repeating in love?"* with options like *"I attract emotionally unavailable people."*

This is a different product bet. They're using astrology as the third lens behind attachment theory + love languages, framed as *"astronomical positioning at your time of birth"* (App Store 4.3(b) compliance language).

**We've made the opposite bet** — astrology-led, with the chart as the magic moment. *"Your real chart. Not your sun sign."* Our motivation options are about self-understanding + life navigation, not relationship patterns.

Both are valid. **Don't blindly port their copy.** The framework citation screen (their step 5) is positioning-locked — it only makes sense if astrology is the third lens, not the first lens.

That said, the **structural device** of citing frameworks before asking for birth data is good craft. We could adapt it as: *"Here's how we read your chart — modern astronomy + transit math + your stated context."* That gives birth-data ask the same de-risking effect without the psychology pivot.

### Opt-in astrology (their step 10)

iOS-version hides the chart wheel + sign labels + stats behind a "✦ See the framework details" tap. Their default reveal shows three relational tiles (HOW YOU ACT / WHAT YOU NEED / HOW OTHERS SEE YOU) — no "Sun in Cancer" until you opt in.

This is correct **for their positioning** (the chart is supporting evidence). For our positioning, the chart wheel **is** the magic moment. Hiding it would gut the reveal.

**Don't copy.** Keep our wheel-forward reveal.

### Generic relational labels

Their reveal cards say `HOW YOU ACT` instead of `☉ SUN`. Again — positioning-locked. For us, the user has explicitly chosen an astrology app; saying `☉ SUN` is direct and on-brand. Saying `HOW YOU ACT` would feel evasive.

**Don't copy.** Keep the planetary glyphs.

---

## Refactoring UI 7-principle scoring

### 1. Visual hierarchy — 6 / 10

**What works:**
- Phase labels (10pt uppercase letter-spaced gold) → h1 (30pt serif) → sub (14pt sans light) is a solid 3-tier hierarchy.
- Option cards have correctly de-emphasized labels relative to values.

**What doesn't:**
- **Every primary CTA is the gold gradient button.** With no second-tier CTA style, the entire flow feels equally "ceremonial." See iOS-version's heroCta vs GoldButton split (recommendation #1 above).
- **Phase labels and CTAs both use gold.** When the phase label and the button both shout "I'm important," neither does.
- **Stats values + life-area card icons + plan badges + goal-back card border + bridge checkmarks all in gold.** Gold has been spread across ~7 different roles. It's no longer a focal accent — it's a brand identifier.

**Fix priority:** Add HeroCta hierarchy. Keep gold for: primary action, single moment per screen, accent (not structural element).

### 2. Spacing & sizing — 7 / 10

**What works:**
- ScrollContent padding `26 horizontal / 20 top / 30 bottom` is consistent.
- Card gaps cluster around 8 / 10 / 12 / 16 / 24 — close to a clean scale.
- 56pt button height is consistent.

**What doesn't:**
- Inconsistent vertical spacing between screen blocks. Some screens have `<View style={{ height: 24 }} />` before CTA, some have 32, some have 20. Should be one number.
- Headlines vary: `marginBottom: 10` (renderHook), `14` (renderMotivation), `lineHeight: 38` (renderHook), `40` (other).
- Bridge rows use `gap: 8` between pain/solution but `padding: 14` outside. Could be a tighter scale.

**Fix priority:** Codify an `S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }` scale in theme and replace ad-hoc values across the file.

### 3. Typography — 8 / 10

**What works:**
- Two-font system (Playfair Display serif + DM Sans body) is enforced.
- Italic emphasis via `FONTS.serifItalic` is used for accent words inside headlines (`<Text style={s.h1em}>`).
- Phase labels are properly de-emphasized: 10pt, letter-spaced 3, uppercase, gold.

**What doesn't:**
- Body sizes vary: 13, 13.5, 14, 15. Should be 12 / 14 / 16 max.
- Line heights: some serif headlines are 38pt at 30 size (1.27 ratio — tight, good), others 46 at 34 (1.35 — fine), and the hook is 46 at 34. Standardize.
- Push-mockup body is 13/19, briefing body is 13/19, transit body is 13.5/21. Tighten to one number per role.

**Fix priority:** Reduce body sizes to {12, 14, 16}. Standardize line heights: tight (1.2) for headlines, normal (1.45) for body, relaxed (1.6) for long-form.

### 4. Color — 6 / 10

**What works:**
- 3-color brand system is restrained: `T.navy`, `T.gold`, `T.cream` + supporting (`warm`, `stone`, `ink`).
- Light/dark theming via `colors` from `useTheme()`.
- Burgundy/clay tokens (`T.clay`, `T.clayDeep`, `T.brass`, `T.surfaceWarm`) exist but are barely used in onboarding.

**What doesn't:**
- **Gold appears in 7+ structural roles.** Phase labels, primary CTA, selected option border, selected option dot, gold-button shadow, plan badges, goal-back border-left, solution-bridge checkmarks, stats values, transit kicker, briefing kicker, reflection kicker. There is no quiet on the screens.
- **Burgundy / clay tokens are unused** in our onboarding. The iOS-version uses `T.clay` as the heroCta background. We don't.
- Gray text colors — `T.stone #7E776A` works but lacks saturation (per Refactoring UI: "Pure grays look lifeless"). The warm scheme already has tint, but we under-use the supporting `T.warm #F3EDE2` for backgrounds.

**Fix priority:**
1. Promote `T.clay` to the ceremonial CTA color (replaces gold gradient on hook/reveal/preview).
2. Reduce gold usage by 50%: keep on phase labels + GoldButton; remove from plan badges, kicker text, stats values where it can.
3. Use `T.warm` for cardAlt backgrounds where currently using `colors.cardAlt` (which is fine but `T.warm` is more deliberate).

### 5. Depth & shadows — 7 / 10

**What works:**
- Two-shadow scale: card shadow (`offset 0/1, opacity 0.04, radius 4`) + button shadow (`offset 0/4, opacity 0.25, radius 16` on gold). Correct elevation hierarchy.
- LinearGradient on the gold button creates a real-feeling raised element.

**What doesn't:**
- **Preview carousel cards** have only the basic card shadow. They should feel "stacked above" the screen — needs a `shadow-md` equivalent (`offset 0/4, opacity 0.08, radius 12`).
- **Locked vs revealed planet cards** use the same shadow. The revealed state should have slightly more elevation.
- No flat-alternative depth (`borderTop` lighter / `borderBottom` darker) — would help bridge rows feel like discrete units.

**Fix priority:** Add a `shadow.md` step (offset 0/4, opacity 0.08, radius 12) for preview cards + revealed planet cards.

### 6. Images & icons — 6 / 10

**What works:**
- Emoji icons in option cards keep the rhythm light, not corporate.
- Chart wheel (`ChartWheel` SVG) is the visual anchor on screen 9.

**What doesn't:**
- **Icon system is mixed.** Emoji (🌊♡◆☽), text glyphs (✦↑☉), ASCII (✗ ✓), and special chars (℞) all coexist. Refactoring UI: "Use icon sets with consistent stroke width and style."
- **Push-notification mockup app icon** is just the ✦ symbol — too thin to read at 22×22pt. Should be a proper rounded-square icon.
- **No empty-state illustration** anywhere. Calculating screen is the closest opportunity for illustration.

**Fix priority:** This is medium-effort to fix properly (would need a real icon set). Defer unless we're doing a brand refresh.

### 7. Layout & composition — 7 / 10

**What works:**
- Left-aligned content with center-aligned hero/calc moments. Correct per Refactoring UI.
- Forms constrained to `scrollContent` width (~313pt on iPhone 16).
- Active reveal breaks rhythm with the chart wheel above the cards — good visual punctuation.
- Preview carousel breaks the vertical-stack monotony with horizontal swipe.

**What doesn't:**
- **Solution bridge** treats every selected pain identically. Refactoring UI: "alternate emphasis: not every card needs the same layout." First selected pain could be larger / illustrated to anchor the eye.
- **Wake-time chips** are 6 uniform pills. The "Varies" option is conceptually different (fallback) and could be visually de-emphasized.
- **Bundle cards** are uniform OptionCards. The recommended "Balanced" default could have a subtle "Recommended" pill.

**Fix priority:** Low — nice-to-have polish, not foundational.

---

## Questionnaire skill scoring — 8 / 10

After this branch's work, we cover:

| Skill archetype | Status |
|---|---|
| 1. Welcome with hook | ✅ |
| 2. Goal question (single-select) | ✅ |
| 3. Pain points (multi-select) | ✅ (after this branch) |
| 4. Social proof | ⚠️ One inline testimonial on paywall — could be earlier |
| 5. Tinder pain cards | ❌ Deferred to v2 |
| 6. Personalized solution | ✅ Solution bridge (after this branch) |
| 7. Comparison table | ❌ Skipped (off-brand) |
| 8. Preference config | ⚠️ Bundle choice serves this role |
| 9. Permission priming | ✅ Modal with D1 push preview |
| 10. Processing moment | ✅ Calculating screen |
| 11. App demo | ✅ Active reveal (tap-to-unlock) |
| 12. Value delivery + viral | ✅ Preview carousel + reveal share buttons |
| 13. Account creation | ⚠️ Post-onboarding, skipped if anon |
| 14. Paywall | ✅ Consolidated, personalized |

Two genuine gaps: **earlier social proof** (move 1 testimonial card to right after pain points) and **Tinder swipe cards** (we already decided to defer).

---

## Specific fixes ranked by ROI

### Priority 1 — Ship in next pass (small effort, large impact)

| Fix | Effort | Impact | Files |
|---|---|---|---|
| Add `HeroCta` component (clay solid, 56pt, no gradient) | XS | High | OnboardingFlowScreen.js |
| Use `HeroCta` on Hook, Active Reveal, Preview, Wake-anchor | XS | High | OnboardingFlowScreen.js |
| Match Hook gradient to Splash (cream ramp + hairline) | XS | High | OnboardingFlowScreen.js, SplashScreen.js |
| Strip mystical orb from Calculating screen | XS | Medium | OnboardingFlowScreen.js |
| Add accessibility props to OptionCard, GoldButton, chip rows | S | Medium | OnboardingFlowScreen.js |
| Add "Skip for now" link on Birth Place screen | XS | Medium | OnboardingFlowScreen.js |

**Total: ~2 hours of work. Brings Refactoring UI score to ~8/10.**

### Priority 2 — Standardize the design system (one-time cleanup)

| Fix | Effort | Impact |
|---|---|---|
| Codify `S = {4,8,12,16,24,32}` spacing scale, replace ad-hoc values | M | Medium |
| Standardize line heights (tight/normal/relaxed) | S | Low |
| Reduce body type sizes to {12,14,16} only | S | Low |
| Add `shadow.md` step for preview cards + revealed planets | XS | Low |
| Codify gold-usage rules: only on phase label + GoldButton + selected-state border | S | Medium |

**Total: ~3 hours. Brings score to ~9/10.**

### Priority 3 — Polish + craft details (defer-able)

| Fix | Effort | Impact |
|---|---|---|
| Port `SimpleTimePicker` from iOS-version | M | Low (only matters if user hits AM/PM bug) |
| Move 1 testimonial earlier in flow | S | Medium |
| Vary first solution-bridge row size for visual hierarchy | XS | Low |
| Add "Recommended" pill on Balanced bundle option | XS | Low |
| Real icon set replacing emoji/glyph mix | L | Medium |
| `startAt` mid-flow re-entry pattern | M | Low (v2) |

---

## What we should NOT change

- **The active reveal interaction.** Tap-to-unlock Sun/Moon/Rising is exactly the right level of demo.
- **The preview carousel.** Mock cards are doing real work.
- **Multi-select pain points.** Right call.
- **Solution bridge.** Strong commitment-consistency move.
- **The paywall consolidation.** Single screen with personalized benefits + 1 testimonial is the correct scope.
- **The two-stage staged dopamine** of (Active Reveal) → (Preview Carousel). This is our equivalent of the Flick "prove" pattern.
- **The bundle choice screen.** This is unambiguously better than 7 toggles.

These are real wins. Don't lose them in a redesign.

---

## Recommendation

Ship Priority 1 fixes in the next implementation pass. They're together ~2 hours of work and they take us from 6.7/10 to ~8/10 on Refactoring UI principles, and bring us to parity with the iOS-version on craft (CTA hierarchy, Splash continuity, accessibility, calc-screen restraint).

Priority 2 (design-system cleanup) is worth doing but can be a separate PR after we A/B-test the new flow. There's no point standardizing a system that might still change.

Priority 3 (polish + craft details) is deferred until we have data showing where the funnel actually leaks. The Refactoring UI book is clear: *details come later — don't obsess over icons, shadows, or micro-interactions until the layout and hierarchy work.*
