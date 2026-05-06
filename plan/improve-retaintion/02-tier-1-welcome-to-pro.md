# Fix B — Welcome to Pro screen

**Status: Tier 1 — must ship**

## Why this matters

PaywallScreen sells aspirational, mystical promises:
- "Infinite Oracle — Whispers from the Stars"
- "Cosmic Strategy — Align with the Divine"
- "The Deep Dive — Unveil Your Hidden Self"
- "Unlimited Circle — Map Your Soul Connections"
- "The Archive — Your Cosmic Library"

Post-purchase delivery (`PaywallScreen.js:181-198`):

```js
Alert.alert('Welcome!', 'Your Celestia Pro subscription is now active.', [
  { text: "Let's Go", onPress: () => navigation.goBack() }
]);
```

A native iOS dialog. Then dropped back to the screen they came from.

**The expectation/delivery gap is the loudest signal in the entire purchase funnel.** It's the moment a user decides "did I just make a smart investment or get tricked?" Right now we hand them a system Alert.

## Goal

Replace the native Alert with a celebratory, full-screen `WelcomeToProScreen` that:
1. Acknowledges the moment (visual + haptic)
2. Shows the 3 most valuable Pro unlocks as **tappable hero cards**
3. Each card is a one-tap path INTO trying that feature (not a description)

By the end of the screen, the user has a clear next action and a felt sense that something opened up.

## Hero-card content

Three cards, in this order:

### 1. "Generate your weekly chart reading" → opens ReportsScreen with `weekly` pre-selected
- Subtitle: "Your transits for the next 7 days, written for your chart."
- Icon: ✦
- The single highest-perceived-value unlock; works for users who never thought to look at Reports

### 2. "Add the people who matter to your Circle" → opens CompatibilityScreen with the add-partner modal pre-opened
- Subtitle: "Up to 3 partners is free. Pro is unlimited — start with your closest 5."
- Icon: ♡
- Drives partner data accumulation, which loads the existing P2.3b partner-insight push

### 3. "Ask Celestia anything — no daily limit" → opens ChatScreen
- Subtitle: "The cap is gone. Sit with a real question for a while."
- Icon: 💬
- Removes the friction the user was hitting on free; makes the unlock feel material

Plus a tertiary "I'll explore on my own →" secondary CTA at the bottom that just navigates to Today.

## Implementation

### Files to touch
- NEW `src/screens/WelcomeToProScreen.js`
- `src/navigation/AppNavigator.js` — register as fullscreen modal route
- `src/screens/PaywallScreen.js` — replace the success Alert with `navigation.replace('WelcomeToPro', { firstTime: !user })`
- `src/services/analytics.js` — new events

### New analytics events
- `WELCOME_TO_PRO_SHOWN` — fires on mount
- `WELCOME_TO_PRO_CARD_TAPPED` — with `card: 'weekly_report' | 'circle' | 'chat'`
- `WELCOME_TO_PRO_DISMISSED` — for "I'll explore on my own"

### Visual treatment

Same brand language as WelcomeScreen / freeze-offer modals:
- Navy gradient background (`#0E0E22 → #1A1535 → #0F1628`)
- Gold accents (T.gold = `#C8A84B`)
- Playfair Display headings, DM Sans body
- Subtle shimmer animation on top icon (mirroring the chart-reveal celebration)
- `haptic.success()` on mount

### Layout sketch

```
   ──────────────────────────────────
   ✦   (subtle shimmer animation)
   
       Welcome to Pro
   
   You've unlocked everything.
   Here are three places to start:
   
   ┌──────────────────────────────┐
   │ ✦  Generate your weekly      │
   │    chart reading              │
   │    Your transits for the next │
   │    7 days, written for your   │
   │    chart.                     │
   │                            →  │
   └──────────────────────────────┘
   
   ┌──────────────────────────────┐
   │ ♡  Add the people who matter │
   │    to your Circle             │
   │    Up to 3 partners is free.  │
   │    Pro is unlimited — start   │
   │    with your closest 5.       │
   │                            →  │
   └──────────────────────────────┘
   
   ┌──────────────────────────────┐
   │ 💬 Ask Celestia anything     │
   │    No daily limit. Sit with   │
   │    a real question for a      │
   │    while.                     │
   │                            →  │
   └──────────────────────────────┘
   
   I'll explore on my own →
   
   ──────────────────────────────────
```

### State branching

Two modes by `firstTime` route param:
- **`firstTime: true`** (no account yet — purchase from PaywallScreen with no auth) → after the user taps any card, route through the existing "create account to protect your subscription" flow
- **`firstTime: false`** (account exists) → tap routes directly to the feature

This preserves the existing post-purchase auth flow without losing the welcome moment.

### Alternative: tour vs. action-first

I considered a 3-screen swipe-tour. Rejected because:
1. Tours have ~5-15% completion rates
2. The tour describes; we want them to *do*
3. Hook Model: Action phase wins over Trigger-phase explanation

Action-first cards force the user to actually open weekly reports / Circle / chat — building muscle memory in the first 60 seconds of being Pro.

## Acceptance criteria

- [ ] PaywallScreen no longer shows native `Alert.alert` after purchase; routes to `WelcomeToProScreen`
- [ ] WelcomeToProScreen renders 3 cards, each with one-tap nav to the relevant Pro feature
- [ ] Tapping a card fires `WELCOME_TO_PRO_CARD_TAPPED` with the card name
- [ ] "I'll explore on my own" routes to Today + fires `WELCOME_TO_PRO_DISMISSED`
- [ ] Subtle shimmer + haptic.success() on mount
- [ ] Brand language consistent with WelcomeScreen
- [ ] When `firstTime: true`, card-tap still routes through the auth flow first (don't lose that protection)

## What this fix doesn't do

- Doesn't replace the existing PaywallScreen — just the post-purchase moment
- Doesn't surface ALL Pro features — picks the 3 highest-value to avoid choice paralysis
- Doesn't auto-trigger anything; the user still chooses the action

## Effort estimate

**Medium.** ~2-3 hours. New screen + minor changes to PaywallScreen and AppNavigator. Brand-matching styles already established from earlier modals.
