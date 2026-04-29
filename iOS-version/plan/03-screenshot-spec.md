# 03 — Screenshot Spec (v1.1 Resubmission)

The reviewer's 4.3(b) decision happens in their **first scroll through your screenshots**, before they read any description. Get this right and the listing wins. Get it wrong and the description doesn't matter.

**Status:** v1.2 update — aligned with the rebuilt onboarding, the 4-tab layout (Today / Connections / Ask / Profile), the Light Liquid Glass theme, and the v1.2 banned-word audit.
**Companion docs:**
- [`plan/ASO/screenshot-captions.md`](ASO/screenshot-captions.md) — OCR-indexed marketing overlay text per frame
- [`plan/screenshots/selected/SELECTION.md`](screenshots/selected/SELECTION.md) — raw-file → frame mapping

---

## Required deliverables

| Asset | Resolution | Quantity |
|---|---|---|
| 6.7" iPhone (iPhone 15 Pro Max / 16 Pro Max) | **1290 × 2796** | 6 minimum (recommended 7), max 10 |
| iPad Pro 12.9" | not required for v1 | 0 (`supportsTablet: false`) |

All portrait. PNG. sRGB color profile. No alpha. Below 8MB each.

---

## Source-of-truth captures

Capture screenshots in the iPhone 15/16 Pro Max simulator (`npx expo run:ios`) on a build with the v1.2 fixes applied. **Run `Profile → DEVELOPER → ✦ Fill Demo Data`** before capturing — it produces consistent demo content (Sasha + Maya/Daniel/Priya + 5 journal entries + the pre-baked AI chat).

Then composite the marketing overlays in Figma / Sketch. Do not ship raw simulator output — every astrology app does that and it pattern-matches.

**Raw captures live in:** `plan/screenshots/raw/`
**Selected captures (with sequence prefixes) live in:** `plan/screenshots/selected/`

---

## The 7 frames, in order

The order matters. Apple's App Store carousel auto-plays the first ~3 frames, so the first three carry the rejection-defense load. The brand-statement hero opens because *"Understand the patterns in your relationships"* settles the 4.3(b) question in 2 seconds.

### Banned-word rule (applies to every frame)

These tokens must appear **zero times** across all marketing overlay text:

`horoscope` · `daily horoscope` · `zodiac` · `fortune` · `tarot` · `manifest` · `manifesting` · `destiny` · `predict` · `prediction` · `Mercury retrograde` · `cosmic` · `divine` · `sacred` · `oracle` · `crystal` · `numerology` · `the universe` · `the stars` (as predictive) · `soulmate` · `soul-level` · `karmic`

Allowed (these reinforce the listing's Tier 1 keywords): `patterns`, `relationships`, `attachment`, `compatibility`, `communication`, `psychology`, `reflection`, `connection`, `dynamics`.

---

### Frame 1 — Brand hook

**Source raw:** `10_onboarding_hero.jpg`
**Lives in `selected/` as:** `alt_a_onboarding-hero.jpg` (move to `01_*` when promoted to main frame)

**Hero text overlay (top of frame, Playfair SemiBold ~64pt):**

> Understand the patterns
> in your relationships.

**Subtext (DM Sans Regular ~30pt):**

> Why you love who you love. Why you keep doing what you do.

**Frame content:**
The Onboarding step 1 screen captured at native resolution — gold ✦ + clay hairline + serif headline + subtext + clay "Begin" button + *"2 minutes · no sign-in"* trust signal at bottom.

**Banned-word audit:** ✅ Zero matches. Headline anchors the listing's core promise (`patterns`, `relationships` = Tier 1 keywords).

**Why this frame opens the carousel:**
- Settles "is this a horoscope app?" in 2 seconds — answer: no, relationship patterns
- Brand statement before features — Apple Books / Calm pattern
- Cream + clay + ink palette reads editorial, not mystical

---

### Frame 2 — Multi-relationship breadth

**Source raw:** `04_connections_list.jpg`
**Lives in `selected/` as:** `01_connections-list.jpg`

**Hero text overlay:**

> Map every relationship
> that matters.

**Subtext:**

> Partner, friend, family, colleague — see how each one works.

**Frame content (lower 70%):**
The Connections tab list showing:
- **Maya** — *♡ Partner* — 76% (or whatever score the demo math produces)
- **Daniel** — *★ Best Friend* — 78%
- **Priya** — *⊙ Parent* — 75%
Plus the "+ Add Someone" pill at the top of the screen, and the bottom tab bar with **Connections** highlighted.

**Banned-word audit:** ✅ Zero matches.

**Why this frame second:**
- Multi-relationship-type breadth (romantic / platonic / family) settles "this is not a couple-quiz app"
- Three distinct colored avatars (pink / purple / gold) provides visual variety without electric purple/blue (saturated category palette)
- Reviewer reads `Partner` + `Best Friend` + `Parent` and understands the breadth in 3 seconds

---

### Frame 3 — AI advisor

**Source raw:** `08_ask_ai_chat.jpg`
**Lives in `selected/` as:** `03_ask-ai-chat.jpg`

**Hero text overlay:**

> Ask anything about
> your relationships.

**Subtext:**

> A calm advisor for the questions you actually have.

**Frame content:**
The Ask tab with a real demo chat:
- User question: *"Why do I always shut down right when things start getting real with someone?"*
- AI reply: pre-baked psychology-led answer about regulation strategy / nervous system / closeness
- Visible **`Written with AI · here for reflection`** disclaimer below the AI message
- Visible **`✦ AI`** label on the AI message timestamp
- Suggestion chips at bottom (e.g., *"What's making professional progress feel slow?"*, *"Ask about Maya"*)

**Banned-word audit:** ✅ Zero matches in either the user question or AI reply.

**Why this frame third:**
- AI advisor is the strongest differentiator vs Co-Star / Sanctuary (those have human readers paywalled, not free AI)
- The disclaimer + ✦ AI label = Apple-2024-AI-policy compliance signal in plain sight
- The shutdown question is universally relatable — reviewer reads it as a real human problem, not an astrology query

---

### Frame 4 — Compatibility depth

**Source raw:** `05_compat_partner_maya_TOP.jpg`
**Lives in `selected/` as:** `02_compat-detail-partner.jpg`

**Hero text overlay:**

> Real depth.
> Plain English.

**Subtext:**

> Strengths, friction, and what to do — without the jargon.

**Frame content:**
The Compatibility detail view (Sasha & Maya — Partner) showing:
- Score circle (e.g., 85)
- Score-tier label *"Deeply harmonious"* (no mystical vocab — verified)
- 4 dimension chips with **colored dots** (no planet glyphs ☽ ♀ ☿ ♄ — gated behind opt-in Discovery toggle)
- Dimensions visible: **Emotional**, **Attraction**, **Communication**, **Stability** with %
- *YOUR LOVE STORY* card with substantive paragraph
- *Share Result* button

**Specifics in the demo content (per the ASO content audit):**
- ✅ Plain language: *"She brings a grounded presence, while he offers dynamic enthusiasm. Together, they build a secure base."* (the gendered pronouns can be addressed in v1.x AI prompt — not a 4.3(b) blocker)
- ❌ Forbidden: zodiac sign references, planet names, "Mercury Retrograde", "destiny"

**Banned-word audit:** ✅ Zero matches in the visible UI copy.

**Why this frame fourth:**
- Proves the depth promise made in Frame 2
- 4 dimensions visible at once = "this is structured analysis, not vibes"
- Score-tier label is psychology-coded ("Deeply harmonious"), not astrology-coded

---

### Frame 5 — Today / Mindfulness category alignment

**Source raw:** `14_today_home_sasha.jpg`
**Lives in `selected/` as:** `04_today-relational-themes.jpg`

**Hero text overlay:**

> Daily reflection,
> weekly clarity.

**Subtext:**

> One question. Your sentence or two. A thoughtful read back.

**Frame content:**
The Today tab with:
- Hero: *"Good afternoon, Sasha"* + S avatar
- *DRIFT ALERT*: *"You haven't checked in on Priya in 4 weeks."* (clamped to ≤52 weeks — bug from earlier round fixed)
- *YOUR CIRCLE*: M / D / P avatars, Priya highlighted with a discreet badge
- *TODAY* card: *"What if the conversation you've been dreading is the one that frees you?"*
- *TODAY'S READ*: substantive psychology-led paragraph addressing the user by name
- *WHAT HELPS TODAY*: 3 actionable bullets

**Banned-word audit:** ✅ Zero matches. *"Daily reflection"* + *"weekly clarity"* + *"thoughtful read back"* are verbatim language used by Calm / Headspace / Stoic — exact Mindfulness-category alignment.

**Why this frame fifth:**
- Lands the Mindfulness category positioning (Calm / Headspace / Stoic vocabulary)
- DRIFT ALERT + YOUR CIRCLE proves the multi-relationship-tracking promise in action
- "Calm, not addictive" — no streaks, no pressure, no daily horoscope card

---

### Frame 6 — Personality blueprint (self-discovery payoff)

**Source raw:** `12_onboarding_big-reveal_sasha.jpg`
**Lives in `selected/` as:** `05_personality-blueprint.jpg`

**Hero text overlay:**

> Your attachment style,
> decoded.

**Subtext:**

> How you connect, where you get stuck, what you need.

**Frame content:**
The Big Reveal screen at the end of onboarding:
- *"✦ YOUR PERSONALITY BLUEPRINT ✦"* gold caps header
- Large serif name (*Sasha*)
- Three psychology tiles:
  - **HOW YOU ACT** — *"You carry more than anyone knows. And you never complain."*
  - **WHAT YOU NEED** — *"Your emotional need: intensity and total honesty."*
  - **HOW OTHERS SEE YOU** — *"The world sees: ambition wearing a poker face."*
- *"✦ See the framework details →"* opt-in pill (the Discovery toggle entry point)
- Closing copy: *"You process the world differently than almost everyone around you — and there are clear reasons why."*

**Banned-word audit:** ✅ Zero matches in any visible tile.

**Why this frame sixth:**
- Re-anchors *"attachment style"* — the Tier 1 keyword from the listing subtitle
- 3 tiles in plain English = pure self-awareness framing, not chart-reading
- The opt-in pill telegraphs the Two-Window architecture (Apple sees psychology, opted-in users see astrology) without leaking astrology vocabulary

---

### Frame 7 — Privacy commitment 🔴 NEEDS FIGMA

**Source raw:** **MISSING — needs design work**
**Lives in `selected/` as:** **TODO**

**Hero text overlay:**

> Privacy by default.

**Subtext:**

> Your data lives on your device. No tracking. No selling. Ever.

**Frame content (per spec — designed asset, not a captured screen):**
- Cream `#FAF8F2` background
- Centered: a stylized device illustration with a lock icon and a small *"Local SQLite"* tag
- ✓ checkmark bullet list:
  - *"No sign-in required"*
  - *"No data sold"*
  - *"AI requests sent without your name"*
  - *"Reset all data anytime"*
- Small footer text: *"Verified by app architecture"* or similar trust line

**Banned-word audit:** ✅ Zero matches.

**Why this frame closes the carousel:**
- Privacy-positive framing reads as the *opposite* of "extractive astrology app"
- 2026 reviewer pool responds well to apps that lead with privacy
- Distinguishes Celestia from competitors who require sign-in / sell data

**Status:** Frame 7 is a designed asset, not a UI capture. Two paths:
- **Recommended:** Build in Figma per spec — 1–2 hours of design work
- **Acceptable fallback:** Skip Frame 7. App Store requires only 3 minimum; 6 strong frames > 7 with one weak.

---

## Alternates available (optional swaps)

These raw files are ready in `selected/` as alternates if the main 7 underperform in App Store Connect Product Page Optimization (PPO) testing later:

| Alt file | Shows | When to swap in |
|---|---|---|
| `alt_b_first-hit-attachment.jpg` | Onboarding 10 — *"You have a Self-Aware Anxious attachment pattern with free-spirited magnetism."* | Could **replace Frame 6** if you want the personalization-moment energy at the personality-blueprint slot |
| `alt_c_journal-composer.jpg` | Journal entry composer — mood + energy + tags + people picker | Could **add as 8th frame** if you want to telegraph the daily-reflection feature |

---

## Layout & visual rules

### Color palette

| Element | Hex | Usage |
|---|---|---|
| Primary background | `#FAF8F2` (cream) | Content frame backdrop |
| Hero overlay text | `#0E0E22` (navy) or `#2A2418` (ink) | Top 25% headline + subtext |
| Accent | `#5C2434` (clay-burgundy) | Primary CTAs in captures |
| Secondary accent | `#C8A84B` (gold) | Used sparingly — milestone moments only |
| ❌ **DO NOT USE** | Vivid purple / electric blue / neon gradients | Pattern-matches to mainstream astrology apps; instant 4.3(b) trigger |

### Typography

- **Hero overlay:** Playfair Display SemiBold, 56-72pt at 1290×2796 device resolution
- **Subtext:** DM Sans Regular, 28-36pt
- **Alignment:** Left-aligned for the first 6 frames (Western reading flow). Frame 7 (privacy) can centre the bullet list.

### Composition

- **Hero overlay** occupies **top 25%** of the 1290×2796 frame
- **App content** occupies **middle 60%** of the frame (lifted slightly with a subtle shadow if needed)
- **Bottom 15%** can be empty, hold the tab bar, or carry an optional micro-disclaimer

### Device frame

- Use a **generic / borderless frame** rather than the obvious "iPhone X chrome." Reviewers recognize template marketing immediately.
- Or: **edge-to-edge content with no frame at all** (more modern look — recommended for 2026 submissions)

---

## What to absolutely avoid in any frame

| Visual / textual element | Why |
|---|---|
| Zodiac wheel as primary visual | Pattern-matches to category |
| Planet glyphs (☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇) anywhere visible | Visual category match |
| Zodiac glyphs (♈♉♊♋♌♍♎♏♐♑♒♓) anywhere visible | Visual category match |
| *"Your sun is..."* / *"Your moon is..."* text overlays | Saturated copy |
| Daily horoscope card centered in frame | The category icon |
| Crystals, candles, mystical iconography | Wellness-spam association |
| Tarot cards | 4.3(b) explicit trigger |
| Mystical emojis (🔮 ✨ 🌙) in marketing text | Visual category match — **even on the privacy frame** |
| Comparative claims (*"better than"*, *"vs"*, *"unlike other apps"*) | Apple Guideline 2.3.1 risk |
| Influencer faces or fake-user faces | Risk of manipulated-marketing flag |
| *"FREE"* or *"$0"* overlays | Restricted in iOS App Store screenshots |
| *"Best"*, *"#1"*, *"Award-winning"* badges | Restricted |
| Score-tier labels using `Soul-level`, `Cosmic`, `Written in the stars`, `Karmic`, `Destined` | Audited and removed in `roleDetailConfig.js` v1.2 — verify the build before capturing |
| Profile name showing typo (*"Sasa"* instead of *"Sasha"*) | Captures must use **Fill Demo Data** to ensure consistent name across hero + AI text |

---

## Localization

For v1: **English (US) only.** Spanish / Portuguese / French expansion is a v1.x task (each adds 6-7 frames × design work). UK / AU English first to follow once v1 is approved (no translation needed; minor copy tweaks).

Per 2025 ASO research, localized listings see ~35% impressions lift — but each locale adds a review surface. v1 ships English to keep the review axis singular.

---

## Tooling

- **Figma** (recommended, most flexible)
- **Screenshots Studio** (free, exports App Store specs directly)
- ❌ Avoid generic mockup-generators — they ship the same template look as every other astrology app

---

## Pre-capture checklist (run before opening the simulator)

- [ ] Build is on v1.2 with all 4.3(b) fixes applied (planet-glyph gating, DRIFT alert clamp, `roleDetailConfig` rewrite, banned-word notification engine sweep)
- [ ] Profile → DEVELOPER → ✦ Fill Demo Data was tapped within the last few minutes
- [ ] App is in **default mode** — `Discovery / Show astrology details` toggle is OFF in Profile (Apple sees this view first)
- [ ] iPhone 15/16 Pro Max simulator selected (1290 × 2796 native)
- [ ] System bar shows iPhone status bar (not Android), no incoming notifications, battery > 60%, full Wi-Fi

---

## Pre-upload checklist (after marketing overlays are applied)

- [ ] All frames 1290 × 2796 px, PNG, sRGB, no alpha, < 8MB each
- [ ] **Banned-word grep** over every overlay caption returns zero matches
- [ ] No file contains the word *"horoscope"* anywhere in image text
- [ ] No file contains zodiac glyphs (♈♉♊...) or planet glyphs (☉☽☿♀♂♃♄...) in the marketing-overlay text
- [ ] First 3 frames lead with relationships (or the brand hook), not astrology
- [ ] AI disclaimer (*"Written with AI · here for reflection"*) visible on Frame 3 (Ask AI)
- [ ] Privacy commitment visible somewhere (Frame 7 if built, or as a sub-caption on another frame)
- [ ] Color palette is warm cream / navy / clay — not electric purple / blue / neon gradients
- [ ] Order in App Store Connect upload matches the order documented in `selected/SELECTION.md`

---

## Compact alternative (6-frame ordering if Frame 7 is dropped)

If Figma work for Frame 7 isn't worth the effort, drop the Privacy frame and ship 6 in this order:

1. Brand hook (`alt_a_onboarding-hero`)
2. Connections list (`01_connections-list`)
3. Ask AI (`03_ask-ai-chat`)
4. Compat depth (`02_compat-detail-partner`)
5. Today (`04_today-relational-themes`)
6. Personality blueprint (`05_personality-blueprint`)

Apple requires only 3 minimum. Six strong frames > seven with one weak.
