# 03 — Screenshot Spec

The reviewer's 4.3(b) decision happens in their **first scroll through your screenshots**, before they read any description. Get this right and the listing wins. Get it wrong and the description doesn't matter.

---

## Required deliverables

| Asset | Resolution | Quantity |
|---|---|---|
| 6.7" iPhone (iPhone 15 Pro Max / 16 Pro Max) | **1290 × 2796** | 6 (min 3, max 10) |
| iPad Pro 12.9" | not required for v1 | 0 (we're disabling iPad — see §J.1 of `01-code-changes.md`) |

All portrait. PNG. sRGB color profile. No alpha. Below 8MB each.

---

## Source-of-truth captures

Generate device-frame screenshots using the iOS Simulator (iPhone 15 Pro Max) with the strip-down build. Then composite the marketing overlays in Figma / Sketch. Don't ship raw simulator output — every astrology app does that and it pattern-matches.

---

## The 6 screenshots, in order

The order matters. Apple's App Store carousel auto-plays the first ~3, so the first three carry the rejection-defense load.

### Screenshot 1 — "All your people, in one place"

**Hero text overlay (top of frame):**
> Every relationship has a pattern.

**Subtext (below hero, smaller):**
> Map the people who matter most.

**Frame content (lower 70%):**
- Circle screen showing 5–7 people cards in a grid:
  - Partner — "Sarah" — 87% sync
  - Best Friend — "Mike" — 91% chemistry
  - Mom — "Diane" — pattern: caretaker/independent
  - Brother — "Marcus" — pattern: rivalry/respect
  - Boss — "Elena" — pattern: directive/intuitive
  - Colleague — "Raj" — pattern: structured/spontaneous
- Each card: name, relationship-type pill, a small color-coded score or pattern tag
- Bottom tab bar visible with **Circle** highlighted

**What this screenshot must NOT show:**
- Daily horoscope card
- Zodiac wheel
- "Your sun sign is..." text
- Mystical emojis (🔮, 🌙, ✨) in the overlay text
- Zodiac glyphs in screenshot text (♈♉♊...)
- The word "horoscope" anywhere

**Why this screenshot:**
- Establishes the app is about **people**, not signs
- Multiple relationship types visible = "this is not couple compatibility, it's a relationship OS"
- Apple reviewer reads in 5 seconds: "this is a relationship app"

---

### Screenshot 2 — "Real depth, not generic compatibility"

**Hero text overlay:**
> See how each connection actually works.

**Subtext:**
> Strengths, friction, and what to do about both.

**Frame content:**
- A specific relationship's detail view — pick "Sarah (Partner)" from screenshot 1
- Top third: Sarah's name, relationship type, and a single connection score
- Middle: 3 strengths, 3 friction points (each with one-sentence specifics, not generic adjectives)
- Bottom: a "Conversation prompt" card: "*This week, try asking Sarah about how she sees the next 6 months — she's processing something she hasn't shared yet.*"

**Specifics to show:**
- ✅ "Sarah needs space when stressed; you need closeness."
- ❌ "You're a Cancer, she's a Capricorn"
- ✅ "Communication friction: she translates feelings into facts; you do the opposite."
- ❌ "Your moon signs are incompatible."

The whole frame should read as **relationship-counseling-light**, not **astrology-text**.

---

### Screenshot 3 — "An advisor for the questions you actually have"

**Hero text overlay:**
> A calm advisor for real questions.

**Subtext:**
> Ask anything. Get a thoughtful answer.

**Frame content:**
- Ask (chat) screen
- One user question visible: **"Why does my mom always feel hurt when I set boundaries?"**
- Below it, the AI's response: 3-4 lines, ending with a specific actionable observation
- Bottom of screen: small disclaimer text "AI-generated · for reflection, not advice"

**Demo questions to consider:**
1. "Why does my mom always feel hurt when I set boundaries?" ← **recommended**, family-relational
2. "How do I bring up money with my partner without it becoming a fight?"
3. "Why do I keep ending up in situationships?"

**Demo questions to avoid:**
- Anything with "horoscope" / "transit" / "Mercury" / "retrograde"
- Anything that implies fortune-telling ("will I meet someone")
- Anything mystical ("what is my soul...")

---

### Screenshot 4 — "Today, framed as people-context"

**Hero text overlay:**
> A weekly read on what's coming up.

**Subtext:**
> Designed to glance at — not obsess over.

**Frame content:**
- Today screen
- Top section: **"This week's relational themes"** (renamed from "Navigator briefing")
- 2-3 cards beneath, each tied to a relationship dimension:
  - "Patience with parents" — short context note
  - "Direct conversation with partner" — short context note
  - "Be lighter with friends" — short context note
- No mention of "horoscope"
- No "Lucky element" or "Lucky color" — explicitly remove from the rendered version for screenshots

---

### Screenshot 5 — "How you show up to others"

**Hero text overlay:**
> See yourself the way others see you.

**Subtext:**
> Your communication style. Your needs. Your blind spots.

**Frame content:**
- Chart screen, but with the **interpretation panel** prominent (not just the wheel)
- Wheel visible in upper third, smaller than usual
- Below the wheel: a 3-tile breakdown:
  - "How you communicate"
  - "What you need to feel safe"
  - "What overwhelms you"
- Each tile: 1-2 sentences in plain English

**Why this framing:**
- Same chart data, different presentation
- "How you show up" reads as self-development, not astrology
- Apple reviewer reads: "this is a self-awareness tool"

---

### Screenshot 6 — "Privacy you can verify"

**Hero text overlay:**
> Your data stays on your device.

**Subtext:**
> No account. No tracking. No selling your information. Ever.

**Frame content:**
- Stylized graphic (not a UI screenshot) showing a device with a lock icon and a small "Local SQLite" tag
- Bullet list:
  - "✓ No sign-in required"
  - "✓ No data sold"
  - "✓ AI requests sent without your name"
  - "✓ Reset all data anytime"

**Why this screenshot exists:**
- Privacy-positive framing reads as the *opposite* of "extractive astrology app"
- Reviewers respond well to apps that lead with privacy in 2026
- The user's actual research has shown privacy is a hot button for the target audience

---

## Layout & visual rules

### Color palette
- Primary background: `#FAF8F2` (cream) for content frames
- Hero text overlay: `#0E0E22` (navy) or `#2A2418` (ink)
- Accent: `#C8A84B` (gold) used sparingly
- **Do not use** vivid purples / electric blue gradients that pattern-match to mainstream astrology apps

### Typography
- Hero overlay: **Playfair Display SemiBold**, 56-72pt at the device resolution
- Subtext: **DM Sans Regular**, 28-36pt
- All text left-aligned for the first 5 screenshots (Western reading flow)

### Composition
- Hero overlay occupies **top 25%** of the frame
- App content occupies **middle 60%** of the frame (lifted slightly with a subtle shadow)
- Bottom 15% can be empty or hold tab bar

### Device frame
- **Use a generic / borderless frame** rather than the obvious "iPhone X chrome." Reviewers recognize template marketing immediately.
- Or: edge-to-edge content with no frame at all (more modern look)

---

## What to absolutely avoid in any frame

| Visual element | Why |
|---|---|
| Zodiac wheel as primary visual | Pattern-matches to category |
| "Your sun is..." / "Your moon is..." text overlays | Saturated copy |
| Daily horoscope card centered in frame | The category icon |
| Crystals, candles, mystical iconography | Wellness-spam association |
| Tarot cards | 4.3(b) explicit trigger |
| Glyphs (♈♉♊...) anywhere on overlays | Visual category match |
| Comparative claims ("better than", "vs", "unlike other apps") | 2.3.1 risk |
| Influencer faces or fake-user faces | Risk of manipulated marketing flag |
| "FREE" or "$0" overlays | Restricted in iOS App Store screenshots |
| "Best", "#1", "Award-winning" badges | Restricted |

---

## Localization

For v1: English screenshots only. Spanish/Portuguese/French expansion is a v1.x task (each adds 6 frames × design work).

---

## Tooling note

For overlays, recommend **Screenshots Studio** (free, exports App Store specs directly) or **Figma** (most flexible). Avoid generic mockup-generators that ship the same template look as every other astrology app.

---

## Pre-upload checklist

- [ ] All 6 screenshots are 1290 × 2796 px
- [ ] PNG format, sRGB, no alpha
- [ ] Each file < 8MB
- [ ] No file contains the word "horoscope" anywhere in image text
- [ ] No file contains zodiac glyphs (♈♉♊...) in marketing overlay text
- [ ] First 3 screenshots all lead with relationships, not astrology
- [ ] Disclaimers visible where applicable (AI label on chat screenshot)
- [ ] Color palette is warm cream/navy/gold — not electric purple/blue
- [ ] Order in App Store Connect upload matches order above
