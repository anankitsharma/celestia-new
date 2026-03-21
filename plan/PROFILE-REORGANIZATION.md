# Profile Tab Reorganization — Through Mia's Eyes

## The Problem
17 sections on one endless scroll. Mia opens Profile to change her reading voice and has to scroll past badges, level roadmaps, devotion milestones, and two shareable cards. She either can't find what she needs or gives up.

## What Mia Actually Uses Profile For (Priority Order)
1. **Quick identity check** — "That's me. Virgo Sun. Cool." (2 seconds)
2. **Settings** — change voice, toggle notifications, switch dark mode (5 seconds)
3. **Share her identity** — screenshot Cosmic ID to IG Stories (10 seconds)
4. **Curiosity** — "What level am I? How many badges?" (30 seconds, occasional)
5. **Account management** — sign in, check subscription (rare)

## The Reorganization

### KEEP ON PROFILE (What Mia sees daily)
These belong on the main Profile scroll — they're her identity + quick settings:

1. **Hero** (avatar, name, birth info, Big 3) — unchanged
2. **Connect Account nudge** — only if not signed in
3. **Quick Stats Strip** — compact: Streak + Level + Pages — ONE row, not 3 cards
4. **Cosmic ID Card** — shareable, the "Instagram moment"
5. **PREFERENCES** — Voice, Depth, Appearance, Notifications (4 rows)
6. **SUBSCRIPTION** — Pro status or upgrade
7. **ACCOUNT** — Sign in/out/delete

### MOVE TO SUBSCREEN: "Your Journey" (Achievements Screen)
These are engagement features Mia checks occasionally, not daily:

- Badges grid (20 badges) → `JourneyScreen.js`
- Level Rewards roadmap (5 tiers) → same screen
- Devotion Milestones (6 streak tiers) → same screen
- Cosmic Rarity Card → same screen
- Current Cosmic Arc → same screen (or move to Today tab where it's contextual)
- Referral section → same screen

**Access:** A single "Your Journey →" row in the Profile settings that opens this subscreen.

### What This Achieves
| Before | After |
|--------|-------|
| 17 sections, 2000px scroll | 7 sections, fits on screen |
| Settings buried at bottom | Settings visible immediately |
| Badges/milestones distract from utility | Badges have their own dedicated space |
| Two shareable cards compete | One clear "share this" moment |

### Mia's Reaction
**Before:** "Where is the dark mode toggle? *scroll scroll scroll* ...past badges, past milestones, past two cards... oh there it is."
**After:** "Profile → Appearance → Dark. Done." (3 taps, 2 seconds)
