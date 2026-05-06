# Replaceable Patterns

Specific outdated patterns currently in the codebase + what to replace them with. Each entry: what's there now, what's wrong, what to ship instead.

---

## R-1: Gold-gradient pill buttons → Flat single-color with refined press

### What's there
Primary CTAs across the app (`PaywallScreen`, `WelcomeToProScreen`, `CancelFlowScreen`, freeze modals, recap modals):

```jsx
<LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={...} end={...} style={ctaStyle}>
  <Text>Continue</Text>
</LinearGradient>
```

### What's wrong
- **Linear gradient on buttons is 2017-era.** Apple deprecated gradient buttons in iOS 13. Every modern iOS app uses flat fill or material-blur.
- **Same gradient everywhere** — no system. Different CTAs should have different visual weight.
- **No press state animation** — `activeOpacity={0.85}` only, no scale.
- **Hard shadow** under each button is heavy.

### Modern replacement
**Tier the buttons** into 3 visual styles:

| Tier | Style | Use |
|---|---|---|
| **Primary** | Solid `T.gold` (or near-gold) fill, navy text, scale 0.97 on press, spring back | Single primary CTA per screen |
| **Secondary** | Gold border, transparent fill, gold text | Alternative actions |
| **Ghost** | Text only, gold tint | Tertiary / "skip" / "later" |

Drop the gradient. The brand is the typography + color system, not the button gradient.

### Effort
M (~3-4 hours). Build `<Button>` component with 3 variants, refactor existing CTAs.

### Priority
HIGH — affects every screen, immediate felt-quality improvement.

---

## R-2: Fullscreen `Modal` for secondary surfaces → Bottom sheets

### What's there
Modals for: NPS prompt, freeze offer, streak restore, D30 callback, surprise insight, Pro week-1 recap, wake-time backfill, journal modal, moon ritual modal. All use `<Modal transparent animationType="fade">` with overlay + centered card.

### What's wrong
- **Fullscreen overlay interrupts user context.** Modern: bottom sheet preserves background context.
- **Drag-to-dismiss missing.** iOS-native expectation.
- **No partial heights.** Every modal is full-height regardless of content.

### Modern replacement
Replace with `react-native-bottom-sheet` library. The library supports:
- Snap points (e.g., 30% / 60% / 90% height)
- Drag-to-dismiss
- Smooth interaction with keyboard
- Backdrop with configurable dim

Build `<BrandSheet>` (parallel to `<BrandModal>`) using bottom-sheet under the hood. Migrate the secondary modals — keep BrandModal for *truly* takeover moments (Welcome to Pro, Cancel flow, D30 callback are takeovers; freeze offer + NPS + journal are not).

### Effort
M (~3-5 days). Add library, build BrandSheet, migrate 5 modals.

### Priority
HIGH.

---

## R-3: ActivityIndicator spinners → Skeleton loaders

### What's there
Spinners during forecast load (HomeScreen), report generation (ReportsScreen), AI synastry (CompatibilityScreen), Pro insight load.

### What's wrong
- **Spinners signal "loading something undefined."** Skeletons signal "loading the thing you're going to see."
- **Layout shift** — spinner takes a fixed area, then real content shows in different area, jarring.

### Modern replacement
Build `<Skeleton>` component:
- Gray rectangle that pulses subtly
- Sized to match the content shape it's replacing
- Fades into real content

Apply to:
- HomeScreen briefing card (skeleton 4 lines + headline placeholder)
- ReportsScreen during generation (skeleton with branded "Reading your transits..." copy)
- ChartScreen deep-dive expander
- CompatibilityScreen synastry analysis

### Effort
M (~2-3 days).

### Priority
HIGH.

---

## R-4: Floating tab pill (Today/Yesterday/Tomorrow/Weekly) → Swipe gestures

### What's there
A horizontal pill below the hero on Today tab — 4 tabs for date navigation.

### What's wrong
- **Wastes prime real estate.** This row is the second-most-prominent area below the hero. It's used for navigation, not content.
- **Tap-to-switch is slower than swipe-to-switch.**
- **The "Weekly" tab logic is confusing** mixed with date navigation.

### Modern replacement
- **Remove the pill.**
- **Swipe horizontally** to navigate yesterday ← → today ← → tomorrow.
- **Move "Weekly" view** to its own dedicated tab OR a lower button "See your week ahead →" within the briefing card.
- Add a subtle dot-pager at the top of the screen indicating current day.

This frees ~60 vertical points for content.

### Effort
M (~2-3 days). Use `react-native-pager-view` or `react-native-screens` paging.

### Priority
HIGH.

---

## R-5: Static chart wheel → Subtly animated chart wheel

### What's there
`<ChartWheel>` component renders a static SVG.

### What's wrong
Beautiful asset doing nothing. A signature visual that could communicate "live" — the cosmos is moving, the chart updates, transits happen.

### Modern replacement
- **Slow, almost-imperceptible rotation** of the outer zodiac ring (1 full rotation per 24 hours).
- **Pulse on active transits** — when a transit planet is touching your natal placement, that planet softly pulses.
- **Hour-hand-style transit indicator** — a faint line indicating the user's current "time" in the sky.

This is the kind of detail that turns a beautiful but static image into a beautiful and *alive* signature.

### Effort
M (~3-5 days). Use `react-native-reanimated` to animate SVG transforms.

### Priority
MEDIUM-HIGH (Chart tab is signature — every detail here pays off).

---

## R-6: AI chat dump-after-wait → Streaming response

### What's there
ChatScreen waits for full Gemini response, then renders the entire AI message at once.

### What's wrong
- **Below ChatGPT/Claude expectations.** Users have been trained to expect streaming.
- **No felt sense of "thinking"** — long waits feel like the app froze.

### Modern replacement
- **Stream Gemini's response** token-by-token using `generateContentStream` API.
- **Animate text entry** — words fade in left-to-right.
- **Breathing-dot indicator** while streaming starts.

### Effort
M-L (~3-5 days). Refactor `sendChatMessage` to use streaming API, animate text reveal.

### Priority
HIGH.

---

## R-7: Stacked tab pills navigation header → Custom hero header per screen

### What's there
Most screens have similar hero gradients with name/Big 3, then below: navigation chrome that's similar across screens.

### What's wrong
Hero gradient looks copy-pasted across screens. Same plum gradient on Today, Chart, Circle, Reports = monotony.

### Modern replacement
**Each screen earns its own hero treatment** while staying within the brand:
- **Today**: warm-plum gradient (current) — focused on time of day
- **Chart**: same gradient with chart wheel as visual anchor
- **Circle**: orbital pattern as bg overlay (riff on the existing empty state)
- **Reports**: editorial page header with section number ("01 / Reports")
- **Profile**: more personal — chart-derived watermark behind name

Don't break the brand; let each screen feel like a different chapter.

### Effort
M (~4-6 hours per screen × 5 = 2.5-3 days).

### Priority
MEDIUM.

---

## R-8: 5 life-area cards as horizontal scroll → Card stack with depth

### What's there
HomeScreen has 5 life-area cards (love, career, vitality, growth, social). Currently rendered as horizontal scroll with each card visible.

### What's wrong
- All 5 visible at once = none get attention.
- No way to see "today's most active" life area.
- Horizontal scroll is OK but uninspired.

### Modern replacement
**Card stack with momentum-swipe** (Bumble-style):
- Top card is largest, full-width, full-content
- Second card peeks below, ghosted
- Swipe horizontally to advance through the stack
- Optionally: sort by intensity so the highest-energy area shows first

This is one of the most-imitated patterns of the last 5 years (Bumble, Hinge, TikTok). Easy to implement; immediately premium-feeling.

### Effort
M (~2-3 days). Use `react-native-deck-swiper` or build with reanimated.

### Priority
MEDIUM-HIGH.

---

## R-9: "Loading..." text → Branded loading copy library

### What's there
ActivityIndicator instances paired with "Loading..." or no text.

### What's wrong
Generic. Throws away brand voice in micro-moments.

### Modern replacement
Loading copy library:
- Forecast load: "Reading the sky..." / "Connecting your placements..." / "Asking the chart..."
- Report generation: "Mapping your week..." / "Drafting your read..."
- Synastry: "Reading both of your charts..." / "Mapping your dynamic..."
- AI thinking: "Thinking..." (with breathing dot)
- Image / chart: "Drawing your chart..."

Store in `src/constants/loadingCopy.js`. Random selection from a small pool prevents staleness.

### Effort
S (~2-3 hours).

### Priority
LOW (already in design-audit Tier 4 backlog).

---

## R-10: Standard tab bar → iOS 18 floating-pill tab bar

### What's there
Custom-rendered TabBar component, but visually reads as a default iOS tab bar.

### What's wrong
You went to the trouble of custom-rendering it. Earn the custom code with a distinctive design.

### Modern replacement
**Floating pill tab bar** — the bottom row floats above content, has rounded edges, drops a soft shadow. Co-Star, Bumble, Linear all use variations. iOS 18's own apps lean this direction.

For Celestia: charcoal-navy pill (matching hero), gold accent on active tab, refined press state. The active tab fills with `GOLD_ALPHA.subtle` instead of changing icon color alone.

### Effort
S-M (~1-2 days).

### Priority
MEDIUM.

---

## R-11: Welcome-back hero on Today → Glanceable "today" indicator

### What's there
Hero shows greeting + name + avatar + streak pill, all in one row.

### What's wrong
The greeting is the same content shown in the briefing card 100 vertical points lower. Redundant. The hero takes ~150pt of vertical real estate to render content that could fit in 60pt.

### Modern replacement
Compact hero:
- Top-left: Big 3 chips (sun/moon/rising) — small, glanceable, identity-anchoring
- Top-right: avatar + streak badge
- A single line of "what today is" — date in editorial format ("Tuesday, in your Mercury return")
- Then directly into briefing card

Frees ~80-100 vertical points for actual content.

### Effort
S (~1-2 hours).

### Priority
MEDIUM.

---

## Summary table

| Pattern to replace | Modern replacement | Effort | Priority |
|---|---|---|---|
| R-1 Gradient buttons | Flat tiered buttons | M | HIGH |
| R-2 Fullscreen Modals | Bottom sheets | M | HIGH |
| R-3 Spinners | Skeleton loaders | M | HIGH |
| R-4 Date tab pill | Swipe gestures | M | HIGH |
| R-5 Static chart wheel | Subtly animated wheel | M | MED-HIGH |
| R-6 Wait-then-dump chat | Streaming response | M-L | HIGH |
| R-7 Same hero everywhere | Screen-specific heroes | M | MEDIUM |
| R-8 5 life-area cards | Card stack with swipe | M | MED-HIGH |
| R-9 Generic loading text | Branded copy library | S | LOW |
| R-10 Default tab bar | Floating pill tab | S-M | MEDIUM |
| R-11 Tall greeting hero | Compact glance hero | S | MEDIUM |

**5 of 11 are HIGH priority. Of those 5, 4 require pure RN code (no native).** The 5th (R-2 bottom sheets) needs a library add.

If only 3 things shipped from this list, I'd ship: **R-1 (buttons), R-3 (skeletons), R-4 (swipe gestures)**. Those three are the clearest "this app is from 2018" signals; fixing them moves Celestia perceptually 5 years forward overnight.
