# Celestia Viral Acquisition Plan

> **Goal:** Minimize acquisition cost by making organic sharing a primary growth channel.
> **Scope:** Research document only — no code changes.
> **Date:** March 2026

---

## Table of Contents

1. [Psychology of Sharing](#1-psychology-of-sharing)
2. [Viral App Pattern Analysis](#2-viral-app-pattern-analysis)
3. [Celestia's Existing Viral Assets](#3-celestias-existing-viral-assets)
4. [The Viral Plan (17 Features, 4 Tiers)](#4-the-viral-plan)
5. [Share Moment Map](#5-share-moment-map)
6. [Acquisition Cost Math](#6-acquisition-cost-math)
7. [Anti-Patterns](#7-anti-patterns)
8. [Implementation Sequencing](#8-implementation-sequencing)

---

## 1. Psychology of Sharing

Eight research-backed frameworks mapped directly to Celestia's feature set. Each framework identifies **why** people share and how Celestia already (or could) trigger that behavior.

### 1.1 Social Currency (Berger, STEPPS Model, 2013)

**Principle:** People share things that make them look interesting, knowledgeable, or unique to their social circle. Sharing remarkable content acts as social currency — the sharer gains status by association.

**Research:** Berger's *Contagious* (2013) identifies Social Currency as the first of six STEPPS drivers. Content that makes people feel like insiders or gives them access to "secret" knowledge gets shared 2-3x more than neutral content. Remarkability — surprising, novel, or exclusive information — is the primary trigger.

**Celestia Mapping:**
- **Cosmic Archetype + Rarity:** `cosmicIdentityService.js` generates archetypes like "The Blazing Pioneer" (Fire-Fire, Rare) or "The Deep Empath" (Water-Water, Rare). Ten archetypes total derived from element pair weighting (Sun +3, Moon +2, Rising +2, other planets +1 each). The rarity label itself is social currency — sharing "I'm a Rare archetype" signals specialness.
- **Big Three Combination Rarity:** `getComboRarity()` returns "1 in 1,728" / "Extremely Rare" for all-same-sign Big Three, "1 in 144" / "Very Rare" for 2-of-3 matching. This numerical rarity is inherently remarkable and share-worthy.
- **Level Progression:** The 5-tier system (Starling → Voyager → Constellation → Nebula → Cosmos) creates insider language. Sharing "I'm a Constellation" signals dedication and knowledge depth.
- **Ultra-Rare Cosmic Whispers:** 0.5% chance whispers ("The cosmos reveals: You carry a rare cosmic signature...") are designed to feel exclusive. Only 3 ultra-rare messages exist in the pool. Sharing them reinforces the sharer's connection to something rare.

**Implementation Lever:** Every share card should include a visible rarity indicator. The `CosmicRarityCard` concept — showing archetype name, element distribution, and "1 in X" rarity — directly leverages social currency.

---

### 1.2 Identity Signaling (Goffman, Presentation of Self, 1956)

**Principle:** People curate a public self through what they share. Social media content is an extension of identity management — we share things that align with how we want to be perceived.

**Research:** Goffman's *The Presentation of Self in Everyday Life* (1956) describes how individuals perform identity for audiences. Subsequent digital identity research (Zhao et al., 2008; Hogan, 2010) shows this extends to social media profiles, where shared content acts as an ongoing identity exhibition. Zodiac content is uniquely powerful here because astrology provides a ready-made identity vocabulary.

**Celestia Mapping:**
- **Big Three as Identity Declaration:** Sun/Moon/Rising is a pre-packaged identity statement. "I'm a Capricorn Sun, Pisces Moon, Scorpio Rising" communicates personality traits, emotional style, and social energy in one sentence. The `CosmicIDCard` component (320px, navy gradient, three-column Big Three layout + element chips + level name) already renders this perfectly.
- **Element Chips:** The archetype chip system (rendered as gold-bordered pills with `borderRadius: 100` in `CosmicIDCard.js`) provides identity labels that users adopt and signal.
- **AI Share Quotes:** `geminiService.js` generates `share_quote` fields in deep dives via `generatePlacementDeepDive()` — pithy, identity-affirming statements like "I don't chase, I attract" that users want to claim as their own. Currently rendered as a styled gradient card on ChartScreen (line 530-534) but **NOT tappable**.
- **Reading Voice:** Users choose a voice (Poetic, Direct, Mystical) that reflects their personality — this preference itself signals identity.

**Implementation Lever:** Share cards should feel like the user's own content, not an app's output. The user's name, sign glyphs, and personal data should dominate the card. App branding should be minimal — the existing `ShareWatermark` ("Celestia / Discover your cosmic blueprint" in subtle `rgba(200,168,75,0.7)`) is well-calibrated.

---

### 1.3 Reciprocity (Cialdini, Influence, 1984)

**Principle:** When someone shares something personal or useful with us, we feel compelled to reciprocate. Compatibility shares are uniquely powerful because they create a two-person download loop — the recipient must download the app to see their side of the match.

**Research:** Cialdini's principle of reciprocity (1984) shows that gifts and favors create obligation. In digital contexts, Regan (1971) demonstrated that favors increase compliance by 2x. When someone shares "our compatibility is 87%," the recipient sees themselves named in the card — they're not an observer, they're a participant — and is motivated to see the full analysis, which requires downloading the app.

**Celestia Mapping:**
- **Compatibility Share Cards:** `CompatibilityShareCard.js` (320px, score ring SVG with 40px radius, gold progress stroke) and `MatchStoryCard.js` (360x640, 4 themes: Aura/Golden/Midnight/Rosé) both include two names and a score. The recipient sees themselves named in the card.
- **"See Our Full Match":** The share CTA should suggest the recipient download to see the complete analysis. This isn't a cold download prompt — it's a personal invitation from someone they know.
- **Shared Values Section:** `CompatibilityScreen.js` (line 521-528) displays relationship values. Sharing "Our shared value is Intellectual Curiosity" is a compliment that triggers reciprocal interest.
- **Existing Hook:** `useShareCard()` from `ShareCard.js` already provides `{ cardRef, captureAndShare }` with PNG capture via `react-native-view-shot` and native share dialog via `expo-sharing`.

**Implementation Lever:** Compatibility invite codes (Tier 2-3). A shareable link that says "See our full cosmic match" with a deep link that, for new users, leads to onboarding → immediate compatibility reveal. This is the highest-conversion viral loop because: (1) it's personally addressed, (2) the recipient's identity is already involved, (3) curiosity about the match result is extremely high, and (4) reciprocity compels the recipient to engage.

---

### 1.4 Emotional Arousal (Berger & Milkman, 2012)

**Principle:** Content that evokes high-arousal emotions (awe, excitement, anxiety, anger) is shared significantly more than content that evokes low-arousal emotions (sadness, contentment) or no emotion at all.

**Research:** Berger & Milkman's landmark 2012 study of 7,000 NYT articles found that high-arousal positive emotions (awe, excitement) increased sharing by 34%. High-arousal negative emotions (anger, anxiety) also drove sharing, but positive arousal was more sustainable and brand-safe. The key variable is **physiological arousal** — content that activates the autonomic nervous system drives action.

**Celestia Mapping:**
- **Badge Unlocks (Awe/Excitement):** `BadgeUnlockModal.js` fires haptic celebration (`haptic.success()` then `haptic.heavy()` at 200ms delay), spring animation (scale 0.5→1.0, tension: 60, friction: 7), and glow pulse (opacity loop 0.3→0.8 over 1200ms). This is peak arousal — but the modal has only a "Continue" button with **zero share prompts**. This is the single highest-impact gap.
- **Level-Ups (Achievement/Pride):** `awardXP()` in `xpService.js` returns `{ leveledUp: true, newLevel: { current: { level, name, xp, nextLevelXp } } }` but no celebration modal exists. Leveling up from "Starling" to "Voyager" is a pride moment with no outlet.
- **High Compatibility Scores (Excitement):** Scores above 80% generate excitement. The share button exists but could be more prominently triggered at the moment of score reveal.
- **Cosmic Whispers (Awe/Mystery):** Ultra-Rare whispers ("A once-in-a-decade transit is touching your chart...") generate awe, but the whisper renders on HomeScreen (line 816-827) as plain text with a rarity badge and **no share prompt**.
- **Mercury Retrograde (Anxiety/Humor):** Cultural phenomenon that triggers both anxiety and humor — perfect for sharing because it's relatable and timely. `isMercuryRetrograde()` already detects it in `astrologyService.js`.

**Implementation Lever:** Add share CTAs at the exact moment of peak arousal:
- Badge unlock → share button BEFORE "Continue" (arousal fades fast)
- Level-up → celebration modal with share
- Whisper appearance → "Share this cosmic message" tap target
- High compat reveal → auto-prompt share at 85%+ scores

---

### 1.5 Self-Verification (Swann, Self-Verification Theory, 1983)

**Principle:** People seek and share information that confirms their existing self-concept. We don't just want to look good — we want to be seen as we see ourselves.

**Research:** Swann's self-verification theory (1983, 2012) demonstrates that people prefer feedback consistent with their self-view, even when that feedback is negative. In social sharing, this manifests as sharing content that "gets me right." Astrology content is uniquely suited to self-verification because sign descriptions are designed to resonate — the Barnum effect combined with genuine astronomical patterns creates a strong "this is so me" response.

**Celestia Mapping:**
- **AI Share Quotes:** `share_quote` fields from `generatePlacementDeepDive()` produce identity-affirming statements. These work because they're specific to the user's chart placements, not generic horoscopes. A Scorpio Mars user gets "My intensity isn't aggression — it's commitment" rather than a generic Scorpio quote. Currently rendered as styled gradient cards on ChartScreen (line 530-534) but **NOT interactive**.
- **Daily Viral Insights:** `forecast.viralInsight` is already designed for sharing — pithy, personal, sign-specific. Currently rendered as a tappable card on HomeScreen (line 942-952) that calls `captureAndShare()` with XP/badge tracking.
- **Deep Dive Insights:** Full planet placement analyses via `generatePlacementDeepDive()` generate self-verification moments ("Your Venus in Capricorn means you love through acts of service" → "That IS how I love").
- **Compatibility Narratives:** When the AI says "You two communicate through unspoken understanding" and the user thinks "yes, exactly" — that's self-verification for the relationship, and it gets shared to the partner.

**Implementation Lever:** Make `share_quote` fields tappable everywhere they appear. Currently, `ChartScreen.js` renders these as styled gradient cards (line 530-534) but they're NOT interactive. A single `TouchableOpacity` wrapper with `onPress={captureAndShare}` turns every deep dive into a share point. The quote is already the perfect format — short, personal, identity-affirming.

---

### 1.6 Scarcity (Cialdini, 1984; Worchel, Lee & Adewole, 1975)

**Principle:** Rare items are perceived as more valuable. When something is scarce — time-limited, exclusive, or hard to obtain — people are more motivated to act on it and share it.

**Research:** Worchel et al. (1975) demonstrated that identical cookies were rated as more desirable when presented in a jar of 2 versus a jar of 10. Cialdini's scarcity principle (1984) extends this to information and experiences. In digital contexts, Spotify Wrapped's annual time-window, BeReal's 2-minute capture window, and Wordle's one-puzzle-per-day all leverage scarcity to drive sharing urgency.

**Celestia Mapping:**
- **Cosmic Whispers (Occurrence Scarcity):** Variable-rate appearance (5-20% daily chance depending on account age), with rarity roll: 96.5% Common (12 messages), 3% Rare (6 messages), 0.5% Ultra-Rare (3 messages). Users may never see an Ultra-Rare whisper in months of daily use. When they do, the rarity itself motivates sharing.
- **Archetype Rarity:** `getComboRarity()` returns "1 in 1,728" / "Extremely Rare" for same-sign Big Three, "1 in 144" / "Very Rare" for 2-of-3 matching. This numerical rarity is inherently share-worthy.
- **Drip-Feed Planet Unlocks:** ChartScreen unlocks planets over time (line 46-60: `unlockedPlanets` state, line 273-285: unlock progress bar). Each unlock is a scarce event (only happens once per planet). Currently triggers a notification but no share card.
- **Mercury Retrograde (Temporal Scarcity):** Only happens ~3x/year for ~3 weeks. Time-limited event cards leverage temporal scarcity.
- **Eclipse/Full Moon Windows (Temporal):** Astronomical events that create 24-48 hour sharing windows.
- **Monthly Recap (Temporal):** `MonthlyRecapCard.js` — only available first of the month. Time-limited recap creates urgency.

**Implementation Lever:** Always display the rarity context alongside shareable content. "Ultra Rare" badges on whispers, "1 in 1,728" on Big Three cards, "3x/year" on Mercury Rx cards. The rarity label isn't decoration — it's the share motivation.

---

### 1.7 Practical Value (Berger, STEPPS Model, 2013)

**Principle:** People share content that is useful to others. Practical, actionable information gets forwarded because it makes the sharer look helpful and the recipient grateful.

**Research:** Berger's STEPPS model identifies Practical Value as a primary sharing driver. "News you can use" — tips, guidance, warnings, recommendations — is shared not for identity signaling but for genuine helpfulness. Older demographics share practical value content at even higher rates than younger ones.

**Celestia Mapping:**
- **Daily Guidance:** `forecast.detailed` contains actionable advice ("Focus your creative energy this morning" or "Avoid signing contracts today"). This is practically useful and shareable.
- **Transit Rituals:** TransitsScreen shows ritual cards (line 304-314) with specific actions ("Light a white candle during tonight's Moon trine" or "Write three intentions before bed"). These are shareable as self-care recommendations. Currently **no share button exists** on TransitsScreen.
- **"DO THIS / WATCH FOR" Guidance:** Transit insights include specific behavioral recommendations. Sharing "Watch for miscommunication today — Mars square Mercury" is practically useful to friends.
- **Mercury Retrograde Tips:** Practical survival guidance during retrograde periods ("Back up your phone," "Double-check travel plans") is highly shareable because it's timely and useful.

**Implementation Lever:** Transit share cards should emphasize the actionable element — the ritual, the tip, the warning — not just the astrological aspect. Frame it as "Today's cosmic tip" rather than "Mars square Mercury." The astrology is context; the practical advice is the share trigger.

---

### 1.8 Narrative Transportation (Green & Brock, 2000)

**Principle:** Stories are shared more than raw data. When people are transported into a narrative, they become more persuaded, more emotionally engaged, and more likely to share.

**Research:** Green & Brock's narrative transportation theory (2000) shows that story-form content creates deeper engagement than informational content. Transported readers show higher attitude change, lower counterarguing, and stronger emotional response. In sharing contexts, narratives outperform statistics because they're easier to retell and more emotionally resonant.

**Celestia Mapping:**
- **Compatibility Narratives > Raw Scores:** `MatchStoryCard.js` includes `insights.oneWord` and `verdict` — narrative summaries that work better than "78% compatible." The card says "Magnetic tension that refuses to be ignored" (displayed as italic Playfair serif, 14pt) rather than showing bar charts. The progress bar (160px, 2.5pt height) is secondary to the verdict.
- **AI Report Storytelling:** `generateFullReport()` returns narrative-form sections with storytelling arc (setup → insight → guidance → affirmation). These are more shareable than bullet-point reports.
- **Cosmic Year Wrapped Potential:** An annual 5-card story sequence (like Spotify Wrapped) would leverage narrative transportation: "Your year began under Saturn's discipline... by summer, Jupiter opened doors... and now, your North Node calls you toward..."
- **Whisper Messages:** Cosmic whispers are micro-narratives ("A past connection will resurface this week...") that create anticipation and story-worthy sharing.

**Implementation Lever:** When designing share cards, always prefer the narrative element over the data element. The `MatchStoryCard` already does this well — the verdict quote is the centerpiece, not the percentage. Apply this principle to all new share cards: lead with the story, support with the data.

---

## 2. Viral App Pattern Analysis

Six apps that achieved viral growth through organic sharing, dissected for replicable patterns.

### 2.1 Co-Star (30M+ Downloads)

**What they did:**
- **Provocative push notifications** became screenshots shared on social media ("You're not being direct enough, and it's going to cost you"). The notifications were designed to be conversation starters, not just reminders.
- **Black-and-white visual identity** made screenshots instantly recognizable in any social feed. The stark, minimal design became a meme format itself.
- **Friend system forces downloads:** "Add a friend" requires both people to have the app. Compatibility readings between friends require mutual participation.
- **Daily updates** create habitual engagement and fresh shareable content every day.

**Celestia Lessons:**
- Share cards need a recognizable visual identity. The navy/gold/cream palette with Playfair Display headings could become Celestia's signature — but only if every share card uses it consistently. Current cards already use `['#0E0E22', '#1A1535', '#0F1628']` gradients and gold `#C8A84B` accents.
- Push notification content (from `notificationContentEngine.js`) could be designed for screenshot-worthiness, not just re-engagement.
- The compatibility invite code system (Tier 2-3) mirrors Co-Star's friend system but without requiring accounts — lower friction.

### 2.2 The Pattern (Celebrity-driven Viral Spike)

**What they did:**
- **Celebrity tweet** (Channing Tatum posted about the app in 2019) drove it to #1 on the App Store within 48 hours. The app's emotionally intense, almost unsettling accuracy went viral.
- **Compatibility "bonds"** between users created interpersonal conversations. Users would text each other "The Pattern says we're about to hit a rough patch."
- **Timing alerts** ("You're entering a period of transformation") created urgency and check-in behavior.
- **No zodiac signs visible** — used birth time data without traditional astrology labels, which broadened appeal beyond astrology-believers.

**Celestia Lessons:**
- Emotionally intense content drives organic sharing more than pleasant content. AI prompts should occasionally produce challenging, provocative insights (not just affirmations).
- Timing alerts map directly to Celestia's transit system. "Mercury squares your natal Venus today — watch your words in love" is a Pattern-style timing alert. `getActiveCosmicWindows()` and `getExactTransitAlerts()` already provide the data.
- Compatibility timing ("You two are entering a tension window") is an untapped feature that could drive mutual engagement.

### 2.3 Spotify Wrapped (Universal Annual Event)

**What they did:**
- **Personal stats transformed into story cards** — listening minutes, top artists, top genres became a 5-10 card story sequence.
- **Time-limited availability** (December only) created FOMO and urgency. If you didn't share Wrapped, you were missing the cultural moment.
- **Universal participation pressure** — when everyone on social media is sharing Wrapped, non-users feel left out. This is the most powerful viral mechanism: social proof creating download pressure.
- **Instagram Stories format** (1080x1920) was native to the sharing platform, making cards feel organic rather than promotional.

**Celestia Lessons:**
- **Cosmic Year Wrapped (Tier 4)** is the direct equivalent. A 5-card annual sequence showing: top transit themes, most-checked planets, compatibility highlights, cosmic score, and "year ahead" preview.
- **Monthly Recap** is a mini-Wrapped. `MonthlyRecapCard.js` is fully built (accepts `recap`, `month`, `year`, `streakDays`, `journalEntries`, `sunSign`; renders "MONTHLY COSMIC RECAP" + stats + headline + summary + top insight + look ahead) but never integrated into any screen. First-of-month integration with sharing creates 12 annual viral moments.
- **Story format (1080x1920)** should be available for all high-value share cards. Currently only `MatchStoryCard.js` uses portrait format (360x640). Scale this up.

### 2.4 BeReal (Notification-Triggered Authenticity)

**What they did:**
- **Random daily notification** triggers a 2-minute capture window. The time pressure creates urgency and FOMO.
- **Universal format** — everyone posts the same front/back camera format, creating a recognizable visual language.
- **Late posts** are marked, creating social pressure to be timely.
- **No filters/editing** reinforced authenticity brand.

**Celestia Lessons:**
- **Cosmic whispers** are already variable-rate triggered (5-20% daily chance, depending on days since first use). Adding a share prompt to whispers creates a BeReal-like "did you get one today?" dynamic among friend groups.
- **Time-limited cosmic windows** (from `getActiveCosmicWindows()` in `astrologyService.js`) could trigger share prompts during the window: "Venus trine Jupiter is active for 4 more hours — share your intention."
- **Daily ritual sharing** — if users complete a moon ritual or journal entry, a time-stamped share card creates BeReal-style authenticity.

### 2.5 Wordle (Grid Format Virality)

**What they did:**
- **Recognizable grid format** — the colored square grid became a visual language that spread across Twitter/X, iMessage, and social media.
- **Spoiler-free sharing** — the grid showed your performance without revealing the answer, encouraging others to try.
- **Daily ritual** — one puzzle per day created habitual engagement and daily sharing cycles.
- **Social comparison** — sharing your score in 3 vs. 6 guesses invited comparison without direct competition.
- **Simplicity** — the share format was a plain-text emoji grid, zero friction.

**Celestia Lessons:**
- **Recognizable format is key.** All Celestia share cards should have consistent visual DNA: navy gradient, gold accents, Playfair serif, "Celestia" watermark. The existing ShareWatermark component already provides this.
- **Spoiler-free element:** Compatibility cards show the score but not the full analysis — "See the full breakdown in Celestia" drives downloads.
- **Daily shareable:** The `DailyShareCard.js` (320px, sun glyph + viral insight + mantra) with viral insight serves this role but needs to be more prominent and consistently formatted.

### 2.6 Locket Widget (Home Screen Presence)

**What they did:**
- **Home screen widget** displayed photos from friends, creating constant app visibility without opening the app.
- **Intimate sharing** — photos were sent to a small circle, not broadcast publicly. This made it feel personal rather than performative.
- **Low friction** — snap a photo, it appears on friends' home screens. No captions, no likes, no comments.

**Celestia Lessons:**
- **iOS widgets** (not yet built for Celestia) could display daily cosmic insights on the home screen — constant brand presence.
- **Intimate compatibility sharing** — sending a match card to one person (via iMessage, WhatsApp) feels personal. The native share sheet already supports this, but CTAs should suggest "Send to [partner name]" rather than generic "Share."

### Common Viral Patterns Extracted

| Pattern | Description | Celestia Mapping |
|---------|-------------|------------------|
| **Recognizable Format** | Visual identity that's instantly identifiable in feeds | Navy/gold palette, Playfair serif, "Celestia" watermark |
| **Identity Expression** | Content that says something about the sharer | Big Three, archetype, level, share quotes |
| **Social Comparison** | Invites friendly comparison without direct competition | Compat scores, streak counts, level names |
| **Limited Windows** | Time-restricted availability creates urgency | Cosmic windows, monthly recap, retrograde events |
| **FOMO** | Non-participants feel excluded | Year Wrapped, monthly recap, rare whispers |
| **Conversation Starters** | Content designed to generate replies | Compat cards, provocative insights, transit warnings |
| **Low Friction** | Minimal steps from trigger to shared content | `captureAndShare()` → native share sheet (2 taps) |

---

## 3. Celestia's Existing Viral Assets

### 3.1 Share Card Components (5 Built)

| Component | File | Dimensions | Data Rendered | Status |
|-----------|------|------------|---------------|--------|
| **DailyShareCard** | `src/components/DailyShareCard.js` | 320px wide | Sun glyph + viral insight or mantra + date + ShareWatermark | Integrated on HomeScreen |
| **CompatibilityShareCard** | `src/components/CompatibilityShareCard.js` | 320px wide | Score ring SVG (r=40, gold stroke) + user/partner names (gold/purple orbs) + score% + verdict | Integrated on CompatibilityScreen |
| **MatchStoryCard** | `src/components/MatchStoryCard.js` | 360x640px | Portrait story card, 4 themes (Aura/Golden/Midnight/Rosé), sign glyphs + names + score (96pt) + progress bar (160px) + verdict | Integrated on CompatibilityScreen |
| **CosmicIDCard** | `src/components/CosmicIDCard.js` | 320px wide | "COSMIC IDENTITY" + name + Big Three (Sun/Moon/Rising with glyphs in bordered boxes) + element chips (gold pills) + level name | Integrated on ProfileScreen |
| **MonthlyRecapCard** | `src/components/MonthlyRecapCard.js` | 320px wide | "MONTHLY COSMIC RECAP" + month/year + stats (days active, journal entries, cosmic score) + headline + summary + top insight + look ahead + watermark | **BUILT, NOT INTEGRATED** |

### 3.2 Share Infrastructure

**`src/components/ShareCard.js`** provides:
- `useShareCard()` hook — returns `{ cardRef, captureAndShare }`
- `captureAndShare(fallbackText)` — captures card as PNG (quality 1.0, tmpfile format) via `react-native-view-shot`, opens native share sheet via `expo-sharing`, falls back to `Share.share()` text on capture failure
- `ShareWatermark` component — "Celestia / Discover your cosmic blueprint" footer in subtle gold (`rgba(200,168,75,0.7)`), 16pt top padding, 8pt bottom

**Engagement Tracking on Share:**
- `achievementService.trackEvent('share')` — increments `shares` counter in AsyncStorage; unlocks "Constellation" badge at 5 shares (`BADGE_CATALOG.constellation`), "Galaxy Spreader" at 25 shares (`BADGE_CATALOG.galaxy_spreader`)
- `xpService.awardXP(profileId, 'share')` — awards XP per share action (amount from `XP_ACTIONS.share`), applies streak multiplier (1.0 to 1.5+), checks for first-action-of-day 2x bonus
- Quest completion tracking when applicable

### 3.3 Share Gap Audit (11 Critical Gaps)

**Screens with existing share triggers:** 3 of 7

| Screen | Existing Share Points | Peak Emotions With **No** Share |
|--------|----------------------|---------------------------------|
| **HomeScreen** | 2: native text share (`handleShare()` at line 510), viral insight tap-to-share (line 942-952 via `captureAndShare()`) | Cosmic whisper (line 816-827), streak milestone, level-up, welcome back comeback bonus |
| **ChartScreen** | 0 | Deep dive `share_quote` (line 530-534, rendered but NOT tappable), Big Three hero display, planet unlock celebration |
| **TransitsScreen** | 0 | Transit AI insights (line 282-316), ritual cards (line 304-314), cosmic windows, retrograde detection |
| **CompatibilityScreen** | 2: `CompatibilityShareCard` (offscreen capture), `MatchStoryCard` via "Share to Stories" button (line 443-448, modal with theme picker at line 632-687) | Shared values (line 521-528), area detail scores, synastry aspects, `shareMatch()` ref imported but unused (line 83) |
| **ProfileScreen** | 1: CosmicIDCard tap-to-share (line 329-341, calls `shareCosmicID()`) | Streak count (line 217-248), XP level display (line 226-240), badge grid (line 251-264), milestone roadmap (line 295-324) |
| **ReportsScreen** | 2: text share (`handleShareText()` line 1235-1241) + PDF download (`handleDownloadPdf()` line 1161-1224 via `Sharing.shareAsync()`) | Report generation celebration, key insight summary (line 1323-1325) |
| **BadgeUnlockModal** | 0 | **Badge unlock celebration (HIGHEST AROUSAL MOMENT IN APP)** — has haptics + spring animation + glow pulse + only a "Continue" button |
| **WelcomeBackModal** | 0 | Streak restoration, comeback bonus (2x Stardust), moon phase info |

**Prioritized Gaps:**

1. **BadgeUnlockModal** — Has "Continue" button only (line 51-53). No share button. This is the highest-arousal moment in the app (haptic celebration at lines 19-20, spring animation, glow pulse). **Critical.**
2. **Level-Up** — `awardXP()` returns `{ leveledUp: true, newLevel }` (line 49-51 of xpService.js) but no celebration modal exists anywhere. Users silently level up.
3. **ChartScreen share_quote** — Deep dive modals render AI-generated `share_quote` as a styled gradient card (line 530-534) but it's non-interactive. One `TouchableOpacity` wrapper turns this into a share point.
4. **Cosmic Whisper** — Appears on HomeScreen (line 816-827) with rarity badge. Rarity tiers: Common (96.5%), Rare (3%), Ultra-Rare (0.5%). No share prompt.
5. **Streak Milestones** — `getMilestoneMessage()` in `streakService.js` (lines 28-39) detects milestones at 3/7/14/30/50/100/365 days with custom messages. Tracked internally but no share card or celebration modal.
6. **TransitsScreen** — AI-generated transit insights (line 282-316), ritual cards (line 304-314), and "DO THIS / WATCH FOR" guidance have zero share capability. Practical value content with no sharing outlet.
7. **MonthlyRecapCard** — Fully built component accepting `{ recap, month, year, streakDays, journalEntries, sunSign }`. Never rendered in any screen.
8. **Big Three (ChartScreen)** — Big Three hero section (line 229-257) displayed prominently but no "Share My Chart" button. Identity signaling opportunity wasted.
9. **Planet Unlock** — Drip-feed unlock system (line 46-60: `unlockedPlanets` state, line 374-398: locked planet view) fires notification but no share card or in-app celebration.
10. **No Deep Linking / Referral System** — No way for shared content to deep-link back to the app. No referral codes. No "see our match" invite flow.
11. **No Compatibility Invite Code** — No mechanism for "Share this link → partner downloads → sees match immediately."

### 3.4 AI-Generated Share Content (Already Available)

These fields are generated by `geminiService.js` but underutilized:

| Field | Source Function | Current Usage |
|-------|----------------|---------------|
| `share_quote` | `generatePlacementDeepDive()` | Rendered as styled card in ChartScreen deep dive modal (line 530-534), **NOT tappable** |
| `viralInsight` | `generateDailyInsight()` | Tappable on HomeScreen (line 942-952), calls `captureAndShare()` with XP/badge tracking |
| `mantra` | `generateDailyInsight()` | Included in native share text (`handleShare()` at line 510), not independently shareable |
| `insights.oneWord` | `generateMatchCore()` | Used as verdict in `MatchStoryCard` (line 122-125) |
| `insights.spark/tension/truth` | `generateMatchViralInsights()` | Rendered in `MatchStoryCard`, fetched on-demand via `handleShareStory()` (line 308-325) |
| Ritual instructions | Transit AI responses | Displayed in TransitsScreen ritual cards (line 304-314), **not shareable** |

---

## 4. The Viral Plan

### TIER 1: Activate Existing Cards (1-2 days each)

These features wire up already-built components and data to share triggers. Minimal new code, maximum impact.

---

#### Feature 1: Share Button on BadgeUnlockModal

**Psychology:** Emotional Arousal (peak excitement at unlock) + Social Currency (badge = status)

**What:** Add a "Share" button to `BadgeUnlockModal.js` alongside the existing "Continue" button. Create `BadgeShareCard.js` — a share card showing the badge icon, name, description, and user's level context.

**Files:**
- **Modify:** `src/components/BadgeUnlockModal.js` — add share button before "Continue" (line 51 area), wire to `useShareCard()` + `captureAndShare()`
- **Create:** `src/components/BadgeShareCard.js` — 320px card with badge celebration design

**Card Design:**
- 320px wide, `borderRadius: 24`
- Gradient: `['#0E0E22', '#1A1535', '#0F1628']` (consistent with existing cards)
- Badge icon (52pt emoji, centered)
- "ACHIEVEMENT UNLOCKED" label in gold (`T.gold`)
- Badge name in Playfair Display 24pt
- Badge description in DM Sans 14pt, cream color
- User's level name at bottom ("Constellation" etc.)
- `ShareWatermark` footer

**Trigger:** Badge unlock celebration — after haptic fires, during peak arousal. Share button rendered alongside "Continue" so user can share OR dismiss.

**XP/Badge Tracking:** Call `awardXP(profileId, 'share')` and `trackEvent('share')` on share action. This means sharing a badge unlock itself counts toward the "Constellation" (5 shares) badge — a satisfying recursive loop.

**Expected Impact:** High — every badge unlock is a high-arousal moment. 20 badges in the catalog = 20 potential share events per user lifetime. Badge unlock is the single highest-arousal moment in the app per Berger & Milkman's framework.

---

#### Feature 2: Tap-to-Share on Deep Dive share_quote

**Psychology:** Self-Verification (identity-affirming quote) + Identity Signaling

**What:** Make the `share_quote` gradient card in ChartScreen deep dive modals tappable. Wrap in `TouchableOpacity` → capture the quote card → native share sheet.

**Files:**
- **Modify:** `src/screens/ChartScreen.js` — wrap share_quote render (line 530-534 area) in `TouchableOpacity` with `onPress` calling `captureAndShare()`. Add subtle "Tap to share" hint text below the quote.
- No new component needed — capture the existing styled card using `useShareCard()` hook.

**Implementation Detail:** The share_quote is already rendered as a visually complete card (gradient background, quote text, sign context). The only change is wrapping it in `TouchableOpacity` and adding a `ref` for `react-native-view-shot` capture.

**Trigger:** User reads deep dive insight, sees personally resonant quote, taps to share.

**Expected Impact:** Medium-High — deep dives are already high-engagement moments (users earn XP for deep_dive actions, tracked at line 91-92). Users who see "their" quote described perfectly are primed to share. ~10 planets = 10 potential quotes per user.

---

#### Feature 3: Integrate MonthlyRecapCard into HomeScreen

**Psychology:** Scarcity (first-of-month only) + Social Currency (stats as status) + FOMO (annual rhythm)

**What:** On the 1st-3rd of each month, render `MonthlyRecapCard` on HomeScreen with a "Share Your Recap" button. Generate recap data from existing SQLite data.

**Files:**
- **Modify:** `src/screens/HomeScreen.js` — add monthly recap section:
  1. Check if current date is 1st-3rd of month
  2. Fetch recap data: `streakService.getStreakData()` for `streakDays`, journal entry count from DB, cosmic score from forecast history
  3. Generate recap narrative via AI (headline, summary, topInsight, lookAhead) or cache from previous generation
  4. Render `MonthlyRecapCard` with share button using `useShareCard()` hook
- **Component already built:** `src/components/MonthlyRecapCard.js` — accepts `{ innerRef, recap, month, year, streakDays, journalEntries, sunSign }`

**Data Assembly:**
```
recap = {
  cosmicScore: calculated from month's forecast energies,
  headline: AI-generated or template ("Your most aligned month yet"),
  summary: AI-generated month narrative,
  topInsight: strongest transit/theme of the month,
  lookAhead: preview of next month's cosmic themes
}
```

**Trigger:** First 3 days of each month, recap appears as a section in HomeScreen feed.

**Expected Impact:** Medium — creates 12 annual share moments. Time-limited availability (3-day window) creates urgency. Monthly cadence avoids fatigue while building anticipation.

---

#### Feature 4: "Share My Chart" Button on ChartScreen

**Psychology:** Identity Signaling (Big Three = identity declaration) + Social Currency (rarity stats)

**What:** Add a "Share My Chart" button below the Big Three hero section on ChartScreen. Create `BigThreeShareCard.js` — a share card showing Big Three with glyphs, element distribution, archetype, and rarity stat.

**Files:**
- **Create:** `src/components/BigThreeShareCard.js` — 320px identity-focused card
- **Modify:** `src/screens/ChartScreen.js` — add share button in Big Three hero section (after line 257 area), wire to `useShareCard()` + `captureAndShare()`
- **Data source:** `cosmicIdentityService.getCosmicArchetype(chart)` for archetype name/rarity/elements, `getComboRarity()` for Big Three rarity stat

**Card Design:**
- 320px wide, `borderRadius: 24`
- Gradient: `['#0E0E22', '#1A1060', '#0C2040']` (matches CosmicIDCard)
- User's name at top (Playfair 24pt)
- Three columns: Sun (☉ glyph + sign name), Moon (☽ glyph + sign name), Rising (↑ glyph + sign name) — each in bordered card boxes matching CosmicIDCard style
- Element distribution: 4 horizontal bars showing Fire/Earth/Air/Water percentages (from `getCosmicArchetype().elementCounts`)
- Archetype name in Playfair + rarity badge pill
- Big Three rarity: "Your Big Three: 1 in 1,728" in gold (from `getComboRarity()`)
- `ShareWatermark` footer

**Trigger:** User views their birth chart, wants to share their cosmic identity. Distinct from CosmicIDCard (Profile) by focusing on chart data rather than engagement stats.

**Expected Impact:** High — Big Three sharing is the most common astrology social behavior. This is the card users will share most frequently. It directly leverages Identity Signaling (1.2) and Social Currency (1.1).

---

#### Feature 5: Share Prompt Rate Limiter

**Psychology:** Anti-fatigue — prevents share prompts from becoming annoying. Based on reactance theory (Brehm, 1966): excessive prompts trigger psychological reactance and reduce willingness.

**What:** Create `sharePromptService.js` — a lightweight service that limits auto-prompted share suggestions to max 1 per session with a 24-hour cooldown.

**Files:**
- **Create:** `src/services/sharePromptService.js`

**Logic:**
```
canShowSharePrompt():
  1. Check in-memory session flag → if already shown this session, return false
  2. Check AsyncStorage 'LAST_SHARE_PROMPT_TIME' → if < 24 hours ago, return false
  3. Return true

recordSharePromptShown():
  1. Set in-memory session flag = true
  2. Save Date.now() to AsyncStorage 'LAST_SHARE_PROMPT_TIME'
```

**Critical Distinction:**
- **Manual share buttons** (user taps "Share My Chart," "Share to Stories," tap-to-share on quote) → ALWAYS work, no rate limiting. These are user-initiated.
- **Auto-prompts** (badge unlock share suggestion, whisper share prompt, level-up share CTA) → Rate-limited. These are app-initiated suggestions.
- Manual shares never count against the rate limit counter.

**Expected Impact:** Protective — prevents share fatigue and user annoyance. Essential infrastructure that must be built BEFORE adding more auto-prompted share triggers in Tier 2.

---

### TIER 2: Viral Loops (3-5 days each)

These features create new share moments at high-emotion points that don't currently have any sharing.

---

#### Feature 6: Streak Milestone Modal + Share Card

**Psychology:** Social Currency (achievement display) + Emotional Arousal (milestone pride) + FOMO ("My friend is on day 30 and I'm not even using this app")

**What:** When a user hits a streak milestone (3/7/14/30/50/100/365 days), show `StreakMilestoneModal.js` with a celebration animation and share button. Capture `StreakShareCard.js`.

**Files:**
- **Create:** `src/components/StreakMilestoneModal.js` — modal with celebration
- **Create:** `src/components/StreakShareCard.js` — 320px share card
- **Modify:** `src/screens/HomeScreen.js` — after `recordDailyCheckIn()`, compare streak before/after to detect milestone crossing, show modal if milestone hit

**Milestone Detection:**
- `streakService.getMilestoneMessage(milestone)` already returns messages for 3/7/14/30/50/100/365:
  - 3: "Cosmic Explorer! 3 days strong"
  - 7: "Stargazer! A full week with the cosmos"
  - 14: "Dedicated! Two weeks of cosmic wisdom"
  - 30: "Moon Cycle Master! 30 days!"
  - 50: "Half Century! 50 days of cosmic alignment"
  - 100: "Celestial Devotee! 100 days!"
  - 365: "Cosmic Legend! A full year!"
- `streakService.getStreakEmoji(streak)` returns tier emoji (🌙→⭐→🔥→💫→✨→💎)
- Rate-limit auto-prompt via `sharePromptService.canShowSharePrompt()`

**Card Design (StreakShareCard):**
- 320px wide, navy gradient
- Large streak number centered (Playfair 72pt, gold)
- Streak emoji above number
- Milestone message below (DM Sans 16pt)
- "days of cosmic alignment" subtitle
- Subtle star pattern background
- `ShareWatermark` footer

**Modal Design (StreakMilestoneModal):**
- Full-screen overlay (matching `BadgeUnlockModal` pattern)
- Confetti/particle animation
- Streak emoji + number + milestone message
- Haptic feedback: `haptic.success()` + `haptic.heavy()`
- Two buttons: "Share" (primary) + "Continue" (secondary)

**Trigger:** Daily check-in crosses milestone threshold. Max 1 auto-prompt per session (rate-limited).

**Expected Impact:** High for both retention and sharing. Streak sharing creates social proof and FOMO. 7 milestone thresholds per user lifetime.

---

#### Feature 7: Level-Up Modal + Share Card

**Psychology:** Emotional Arousal (achievement pride) + Social Currency (level = status within app ecosystem)

**What:** When `awardXP()` returns `leveledUp: true`, show `LevelUpModal.js` with the new level name, tier visual, and share button. Capture `LevelUpShareCard.js`.

**Files:**
- **Create:** `src/components/LevelUpModal.js` — celebration modal
- **Create:** `src/components/LevelUpShareCard.js` — 320px share card
- **Modify:** `src/screens/HomeScreen.js` — check every `awardXP()` return for `leveledUp`, queue modal display (use state queue to avoid overlapping with badge/streak modals)

**Data from awardXP() return:**
```javascript
{
  leveledUp: true,
  newLevel: {
    current: { level: 3, name: 'Constellation', xp: 500, nextLevelXp: 2000 }
  }
}
```

**Level Tier Visuals:**

| Level | Name | Visual Theme | Color Accent |
|-------|------|-------------|--------------|
| 1 | Starling | Single star | Silver |
| 2 | Voyager | Constellation outline | Blue-silver |
| 3 | Constellation | Star cluster | Gold |
| 4 | Nebula | Nebula swirl | Purple-gold |
| 5 | Cosmos | Galaxy spiral | Iridescent gold |

**Card Design (LevelUpShareCard):**
- 320px wide, gradient matching level tier
- "LEVEL UP" header in gold
- Level name large (Playfair 32pt)
- Level icon/visual
- Total XP count
- "Ascended to [Level Name]" tagline
- `ShareWatermark` footer

**Trigger:** Any XP award crossing a level threshold. Each user has 4 level-up moments across their lifetime. Rate-limited auto-prompt.

**Expected Impact:** High — level-ups are infrequent milestone achievements that feel significant. The level name ("I'm now a Constellation") becomes part of the user's identity vocabulary.

---

#### Feature 8: Cosmic Whisper Share Prompt + Card

**Psychology:** Scarcity (rare occurrence) + Emotional Arousal (awe/mystery) + Social Currency (rarity bragging)

**What:** When a cosmic whisper appears on HomeScreen, add a subtle "Share this message" tap target below it. Create `WhisperShareCard.js` with the whisper text, rarity tier badge, and mystical styling.

**Files:**
- **Create:** `src/components/WhisperShareCard.js` — 320px mystical card
- **Modify:** `src/screens/HomeScreen.js` — add `TouchableOpacity` to whisper render (line 816-827 area), on press → capture `WhisperShareCard` → `captureAndShare()`

**Card Design:**
- 320px wide
- Dark mystical gradient `['#0A0520', '#1A0A30', '#050210']`
- Whisper text centered in italic Playfair Display, 18pt, cream (`T.cream`)
- Rarity badge (conditional):
  - **Common:** No rarity badge (don't highlight lack of rarity — 96.5% of whispers)
  - **Rare:** Gold border pill: "Rare Cosmic Whisper" (3% of whispers)
  - **Ultra Rare:** Animated gold pill with glow: "Ultra Rare Cosmic Whisper" (0.5% of whispers)
- Small decorative moon/star elements
- `ShareWatermark` in reduced opacity

**Design Principle:** The whisper card should feel mysterious and precious — not promotional. No user data on the card (the whisper IS the content). Recipients should feel they're receiving a cosmic message, not an app advertisement.

**Trigger:** Whisper appears on HomeScreen (variable 5-20% daily chance based on account age). Share is user-initiated (tap), not auto-prompted — whispers are rare enough that a share button doesn't feel pushy.

**Expected Impact:** Medium — frequency is low (by design), but share rate per impression will be high because rarity creates motivation. Ultra-Rare whispers (0.5%) will be shared at very high rates due to scarcity psychology (1.6).

---

#### Feature 9: Story-Format DailyShareCard (1080x1920)

**Psychology:** Platform Optimization — Instagram Stories, TikTok, and Snapchat all use 9:16. Content formatted for stories gets more engagement and feels native to the platform.

**What:** Create a story-format version of `DailyShareCard` optimized for Instagram Stories (1080x1920). Same data, vertical layout, larger typography, more visual real estate.

**Files:**
- **Create:** `src/components/DailyStoryCard.js` — 360x640px capture (scales to 1080x1920)
- **Modify:** `src/screens/HomeScreen.js` — add story-format option to share flow (e.g., "Share to Stories" button alongside existing share, or long-press for story format)

**Card Layout (360x640 capture → 1080x1920 output):**
- **Top third (0-213px):** Large sun glyph (~120pt) + sign name in gold
- **Middle third (213-426px):** Viral insight text centered, Playfair Display 28pt, cream on navy
- **Bottom third (426-640px):** Mantra in DM Sans 16pt, date, `ShareWatermark`
- **Background:** Navy gradient `['#0E0E22', '#1A1535', '#0F1628']` with static star scatter pattern (small gold dots, not animated)

**Relationship to Existing DailyShareCard:**
- `DailyShareCard.js` (320px square-ish) → best for iMessage, Twitter, general sharing
- `DailyStoryCard.js` (360x640 portrait) → best for Instagram Stories, Snapchat, TikTok
- Both use same data: `{ sunSign, viralInsight, mantra, date }`
- Both use `useShareCard()` hook for capture

**Trigger:** User taps "Share to Stories" variant of existing daily share.

**Expected Impact:** Medium — story-format content gets 2-3x more engagement on Instagram than square/landscape. This expands reach of existing daily shares to story-native platforms.

---

#### Feature 10: Transit Share Card + Button

**Psychology:** Practical Value (actionable guidance) + Social Currency (astrological knowledge)

**What:** Add a "Share This Transit" button to expanded transit cards on TransitsScreen. Create `TransitShareCard.js` showing the transit aspect, personalized meaning, and ritual/action item.

**Files:**
- **Create:** `src/components/TransitShareCard.js` — 320px practical-focused card
- **Modify:** `src/screens/TransitsScreen.js` — add share button to expanded transit cards (line 262-326 area), alongside existing "Ask Celestia" button (line 320-323)

**Card Design:**
- 320px wide, navy gradient
- Transit header: aspect name (e.g., "Moon trine Jupiter") with sign glyphs
- Meaning: 2-3 line AI-generated insight (from transit expansion data, line 282-316)
- "TODAY'S RITUAL" box: action item from ritual card (line 304-314)
- Date + time window if applicable
- `ShareWatermark` footer

**Design Principle:** Emphasize the actionable element. The ritual/tip is the share trigger, not the astrological jargon. "Today's Ritual: Set 3 intentions during tonight's Moon trine Jupiter" is more shareable than "Moon trine Jupiter at 14°32' Taurus."

**Trigger:** User reads expanded transit card, finds it relevant, taps share button.

**Expected Impact:** Medium — transit content is practically useful and timely. Practical Value (1.7) is the driver here. TransitsScreen currently has **zero** share capability — this opens an entirely new sharing surface.

---

#### Feature 11: Compatibility Invite Code

**Psychology:** Reciprocity (personal invitation) + Curiosity (incomplete information) + Identity (both people named)

**What:** After viewing a compatibility result, users can generate an invite link. The recipient taps the link → downloads Celestia → enters their birth data → immediately sees the full compatibility analysis with the inviter.

**Files:**
- **Create:** `src/services/inviteService.js` — generate unique invite codes, store pending matches in Supabase, handle invite redemption
- **Modify:** `src/screens/CompatibilityScreen.js` — add "Invite [Partner] to See Your Match" button after score reveal
- **Modify:** `src/navigation/AppNavigator.js` — handle deep link for invite codes

**Flow:**
1. User A views compatibility with partner data they entered manually
2. User A taps "Invite [Name] to See Your Match"
3. System generates shareable link with invite code (stored in Supabase with inviter's profile ID, partner birth data, cached score/verdict, 30-day expiry)
4. User A shares link via native share sheet (iMessage, WhatsApp, etc.)
5. User B receives link → taps → App Store (if not installed) → opens app
6. After onboarding, User B sees: "[User A] shared your cosmic match! Your compatibility: 87%"
7. User B can view the full analysis immediately
8. Both users receive XP reward (100 XP for referral)

**Invite Code Data Structure:**
```
{
  code: string (unique),
  inviter_id: string (profile ID for XP reward),
  partner_birth_data: { date, time, location },
  cached_score: number,
  cached_verdict: string,
  created_at: timestamp,
  expires_at: timestamp (30 days),
  redeemed: boolean,
  redeemed_by: string (profile ID)
}
```

**Expected Impact:** Very High — this is the strongest viral loop in the entire plan because:
1. It's personally addressed (1:1, not broadcast) → Reciprocity (1.3)
2. The recipient's identity is already involved → Identity Signaling (1.2)
3. Curiosity about the match result is extremely high → Emotional Arousal (1.4)
4. Download-to-value time is near-zero (match result shown immediately)
5. Conversion rate for personal invitations is 5-10x higher than broadcast shares

**Dependency:** Requires Feature 12 (deep linking) for seamless link → app routing. Can be implemented with basic URL scheme first, then upgraded to universal links.

---

### TIER 3: Network Effects (5-10 days each)

These features build infrastructure for viral growth beyond individual shares.

---

#### Feature 12: Deep Linking Infrastructure

**Psychology:** Friction Reduction — every tap removed from the share-to-download funnel increases conversion. Users who tap a link and land on a relevant screen convert at 3-5x the rate of users who tap a link and land on a generic App Store page.

**What:** Implement universal links (iOS) and app links (Android) so that shared content opens directly in the app (if installed) or routes through App Store to the correct screen.

**Files:**
- **Create:** `src/services/deepLinkService.js` — handle incoming deep links, route to correct screen, parse parameters
- **Modify:** `app.json` / `app.config.js` — configure universal link domains, associated domains entitlement
- **Modify:** `src/navigation/AppNavigator.js` — deep link route mapping via React Navigation's `linking` config

**Link Types:**
| Link Pattern | Purpose | Landing Screen |
|-------------|---------|----------------|
| `celestia.app/invite/{code}` | Compatibility invite | Onboarding → Compat reveal |
| `celestia.app/share/{type}/{id}` | Shared card view | Relevant screen |
| `celestia.app/referral/{code}` | Referral reward | Onboarding + 100 XP |

**Priority:** This is infrastructure that enables Features 11 (invite codes) and 13 (referrals). Build this before or alongside those features. Can start with basic `expo-linking` URL scheme and upgrade to universal links later.

---

#### Feature 13: Referral Reward System

**Psychology:** Reciprocity (mutual reward) + Practical Value (XP incentive) + Social Currency (referral badge)

**What:** Users get a unique referral code. When a new user signs up with a referral code, both the referrer and the new user receive 100 XP + progress toward referral badges.

**Files:**
- **Create:** `src/services/referralService.js` — generate/validate referral codes, track referrals, award rewards
- **Modify:** `src/screens/ProfileScreen.js` — add "Invite Friends" section with referral code display and share button
- **Modify:** `src/constants/badges.js` — add referral badges
- **Requires:** Supabase backend for cross-user referral tracking

**New Badges:**
| Badge | Condition | Category |
|-------|-----------|----------|
| Cosmic Connector | 3 successful referrals | Social |
| Star Network | 10 successful referrals | Social |

**Reward Structure:**
- Referrer: 100 XP + referral count increment toward badges
- New user: 100 XP bonus (meaningful head start — equivalent to ~4-5 standard actions)
- No limit on referral rewards (but XP value stays constant to avoid inflation)
- Referral badge progress visible on ProfileScreen

**Expected Impact:** Medium — referral systems with meaningful rewards achieve 3-5% conversion rates. 100 XP is significant enough to motivate without being game-breaking.

---

#### Feature 14: Cosmic Rarity Share Card

**Psychology:** Social Currency (rarity = status) + Scarcity (numerical rarity) + Identity Signaling

**What:** A dedicated share card showing the user's cosmic archetype, element distribution, Big Three rarity, and "1 in X" statistic. Distinct from BigThreeShareCard by focusing on rarity and archetype rather than chart data.

**Files:**
- **Create:** `src/components/CosmicRarityCard.js` — 320px rarity-focused card
- **Data source:** `cosmicIdentityService.getCosmicArchetype(chart)` returns `{ name, tagline, rarity, primaryElement, secondaryElement, elementCounts, dominanceRatio }` + `getComboRarity()` returns `{ label, description }`
- **Accessible from:** ChartScreen (new button) and ProfileScreen (Cosmic ID section)

**Card Design:**
- 320px wide, navy-to-deep-purple gradient `['#0E0E22', '#1A0A2E', '#0C1040']`
- Archetype name large (Playfair 28pt, gold)
- Tagline in italic DM Sans 14pt, cream
- Element distribution: 4 small horizontal bars (Fire/Earth/Air/Water) with percentages, colored per element
- Rarity badge: gold border pill with rarity text ("Rare" / "Uncommon" / "Common")
- Big Three rarity stat: "Your Big Three: 1 in 1,728" or "1 in 144" in gold
- `ShareWatermark` footer

**Expected Impact:** Medium-High — rarity content has proven viral in gaming (rare loot screenshots) and personality tests ("Only 2% of people get this result"). The "1 in 1,728" statistic from `getComboRarity()` is inherently remarkable. The 10 archetype names (The Blazing Pioneer, The Deep Empath, etc.) provide shareable identity labels.

---

### TIER 4: Viral Moments (Strategic, Event-Driven)

These features create time-limited sharing opportunities tied to astronomical or cultural events.

---

#### Feature 15: Mercury Retrograde Survival Kit Card

**Psychology:** Practical Value (survival tips) + Emotional Arousal (anxiety/humor) + Scarcity (3x/year) + Cultural Moment

**What:** When Mercury retrograde is detected (via `isMercuryRetrograde()` in `astrologyService.js`), generate a shareable "Mercury Rx Survival Kit" card with personalized tips based on which house Mercury transits in the user's chart.

**Files:**
- **Create:** `src/components/MercuryRxCard.js` — story-format card (360x640)
- **Modify:** `src/screens/HomeScreen.js` or `src/screens/TransitsScreen.js` — show Mercury Rx card during retrograde periods with share button

**Card Content:**
- "MERCURY RETROGRADE SURVIVAL KIT" header
- Retrograde dates (start → end)
- "Mercury Rx in your Xth house" (personalized via user's natal chart)
- 3-4 tips mixing practical and humorous:
  - "Back up your phone before Mercury eats your photos"
  - "Read contracts twice, sign once"
  - "That ex texting you? Mercury made them do it"
  - House-specific tip (e.g., Rx in 7th house: "Relationship conversations need extra patience")
- Tone: witty, self-aware, meme-friendly
- `ShareWatermark`

**Cultural Leverage:** Mercury retrograde is one of the most widely known astrological phenomena, referenced in mainstream media, memes, and casual conversation. Non-astrology-users share Mercury Rx content. This card rides an existing cultural wave — Celestia doesn't need to create awareness, just provide the best card format.

**Frequency:** ~3x/year, each lasting ~3 weeks. Time-limited = urgency.

**Expected Impact:** High — Mercury Rx content consistently goes viral on social media during retrograde periods. Personalized house-specific tips add Celestia-specific value that generic memes can't match.

---

#### Feature 16: Eclipse / Full Moon Event Cards

**Psychology:** Scarcity (time-limited 24-48hr window) + Emotional Arousal (awe at astronomical events) + Practical Value (ritual guidance)

**What:** During eclipses, full moons, and new moons, generate time-limited share cards with personalized guidance. Cards are only available during the event window (24-48 hours).

**Files:**
- **Create:** `src/components/LunarEventCard.js` — story-format card, moon phase visual
- **Data source:** `astrologyService.js` moon phase calculations + transit data
- **Modify:** `src/screens/HomeScreen.js` — event banner with share button during active events

**Event Types:**

| Event | Frequency | Window | Example Share Content |
|-------|-----------|--------|----------------------|
| Full Moon | Monthly | 24 hours | "Full Moon in Scorpio — release what no longer serves you. The Moon illuminates your 8th house of transformation." |
| New Moon | Monthly | 24 hours | "New Moon in Pisces — set your intentions. Dream big under this 12th house activation." |
| Lunar Eclipse | 2-4/year | 48 hours | "Lunar Eclipse in your 7th house — relationship revelations incoming. Journal what surfaces." |
| Solar Eclipse | 2-4/year | 48 hours | "Solar Eclipse in Aries — new beginnings in identity and self-expression." |

**Card Design:**
- 360x640 (story format)
- Moon phase visual (circle with appropriate illumination)
- Event name in Playfair Display
- Sign + house personalization
- Ritual suggestion (1-2 sentences)
- Time window indicator ("Active for 18 more hours")
- `ShareWatermark`

**Expected Impact:** Medium — monthly full/new moon cards create a regular sharing rhythm (24 moments/year). Eclipses (rarer, 2-4/year) create higher-impact moments due to increased scarcity and cultural awareness.

---

#### Feature 17: Cosmic Year Wrapped (Annual)

**Psychology:** Narrative Transportation (story arc) + Scarcity (annual, time-limited) + FOMO (universal participation pressure) + Identity Signaling (personal stats)

**What:** Annual 5-card swipeable story sequence (like Spotify Wrapped) summarizing the user's cosmic year: top transits, engagement stats, compatibility highlights, personal growth themes, and year-ahead preview.

**Files:**
- **Create:** `src/components/CosmicYearWrapped.js` — 5-card swipeable story sequence, each 360x640
- **Create:** `src/services/yearWrappedService.js` — aggregate annual data from SQLite (reports generated, chat sessions, streak records, compatibility checks, transit interactions, badges earned, XP gained, journal entries)
- **Modify:** `src/screens/HomeScreen.js` — show Year Wrapped banner in late December/early January

**5-Card Sequence:**

**Card 1: "Your Cosmic Year"**
- Total days active, total XP earned, level reached
- "You checked the stars X times this year"
- Most active zodiac season (which month/season had most engagement)

**Card 2: "Your Top Transits"**
- 3 most significant transits that affected the user's chart during the year
- Brief AI-generated narrative for each
- "Jupiter entered your 10th house in March — career breakthroughs followed"

**Card 3: "Your Cosmic Connections"**
- Number of compatibility checks run
- Highest compatibility score + partner sign
- "Your most cosmic match: [Score]% with a [Sign]"

**Card 4: "Your Growth"**
- Badges earned this year (count + favorites)
- Reports generated (count + types)
- Journal entries written
- Longest streak achieved
- Personal archetype + rarity reminder

**Card 5: "Your Year Ahead"**
- 3 major upcoming transits for the new year
- Preview of dominant themes (career, love, growth)
- "2027 brings Saturn into your 5th house — creativity and joy await"
- CTA: "Share Your Cosmic Year"

**Release Window:** December 15 — January 15 (1 month). After window closes, cards become view-only (share button removed). The time limit creates FOMO ("Everyone is sharing their Cosmic Year Wrapped and I haven't yet").

**Per-Card Sharing:** Each card can be shared individually via `captureAndShare()`. Users typically share 2-3 cards from a 5-card sequence (Spotify data), generating multiple impressions per user.

**Expected Impact:** Very High if executed well. Spotify Wrapped generates billions of social impressions annually. A cosmic equivalent taps into identical psychology: personal stats + story format + time-limited availability + universal participation pressure. This is the single highest-potential viral feature but also the most complex to build.

**Timeline Note:** Requires 6+ months of user data to generate meaningful stats. Build data aggregation early, ship the UI in November for a December launch.

---

## 5. Share Moment Map

For each of the 7 main screens + cross-screen modals: the peak emotional moment, recommended share trigger, card format, CTA copy, and what the recipient sees.

### HomeScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Daily forecast read | Manual (existing) | `DailyShareCard` (320px) | "Share Today's Insight" | App Store → onboarding → daily forecast |
| Viral insight expanded | Manual (existing) | `DailyShareCard` capture | "Tap to share ↗" | App Store → daily forecast |
| Cosmic whisper appears | Manual (NEW) | `WhisperShareCard` (320px) | "Share this cosmic message" | App Store → onboarding |
| Streak milestone hit | Auto-prompt (NEW) | `StreakShareCard` (320px) | "Share My Streak" | App Store → onboarding |
| Level up achieved | Auto-prompt (NEW) | `LevelUpShareCard` (320px) | "Share My Level" | App Store → onboarding |
| Monthly recap (1st-3rd) | Manual (NEW) | `MonthlyRecapCard` (320px) | "Share Your Cosmic Month" | App Store → onboarding |
| Mercury Rx active | Manual (NEW) | `MercuryRxCard` (360x640) | "Share Survival Kit" | App Store → onboarding |
| Lunar event active | Manual (NEW) | `LunarEventCard` (360x640) | "Share This Moon" | App Store → onboarding |

### ChartScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Big Three viewed | Manual (NEW) | `BigThreeShareCard` (320px) | "Share My Chart" | App Store → onboarding → chart |
| Deep dive share_quote | Manual (NEW) | Existing styled card capture | "Tap to share ↗" | App Store → onboarding |
| Planet unlocked | Auto-prompt (NEW) | Unlock celebration capture | "Share My Discovery" | App Store → onboarding |
| Cosmic rarity stat | Manual (NEW) | `CosmicRarityCard` (320px) | "Share My Cosmic Rarity" | App Store → onboarding |

### TransitsScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Transit insight read | Manual (NEW) | `TransitShareCard` (320px) | "Share This Transit" | App Store → onboarding → transits |
| Ritual card viewed | Manual (NEW) | `TransitShareCard` (ritual variant) | "Share Today's Ritual" | App Store → onboarding |
| Cosmic window active | Manual (NEW) | Window section capture | "Share This Cosmic Window" | App Store → onboarding |

### CompatibilityScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Score revealed | Manual (existing) | `MatchStoryCard` (360x640) | "Share to Stories" | App Store → onboarding |
| Score ring viewed | Manual (existing) | `CompatibilityShareCard` (320px) | "Share" | App Store → onboarding |
| High score (85%+) | Auto-prompt (NEW) | `MatchStoryCard` prompt | "This match is rare! Share?" | App Store → onboarding |
| Invite partner | Manual (NEW) | Native share with deep link | "See Our Cosmic Match" | Deep link → App Store → onboarding → match reveal |

### ProfileScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Cosmic ID viewed | Manual (existing) | `CosmicIDCard` (320px) | "Tap card to share" | App Store → onboarding |
| Streak count viewed | Manual (NEW) | `StreakShareCard` (320px) | "Share My Streak" | App Store → onboarding |
| Badge tapped | Manual (NEW) | `BadgeShareCard` (320px) | "Share Badge" | App Store → onboarding |
| Referral code | Manual (NEW) | Native share with referral link | "Join me on Celestia — get 100 bonus XP" | Deep link → App Store → onboarding + 100 XP |

### ReportsScreen

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Report complete | Manual (existing) | Native text share | "Share" | App Store → onboarding |
| PDF generated | Manual (existing) | PDF via `Sharing.shareAsync()` | "Download PDF" | PDF file |
| Key insight viewed | Manual (NEW) | Insight card capture | "Share This Insight" | App Store → onboarding |

### Cross-Screen Modals

| Peak Moment | Trigger Type | Card Component | CTA Copy | Recipient Experience |
|-------------|-------------|----------------|----------|---------------------|
| Badge unlocked | Auto-prompt (NEW) | `BadgeShareCard` (320px) | "Share Achievement" | App Store → onboarding |
| Year Wrapped (Dec-Jan) | Manual (NEW) | `CosmicYearWrapped` (360x640, 5 cards) | "Share Your Cosmic Year" | App Store → onboarding |

---

## 6. Acquisition Cost Math

### Current State (Estimated)

| Metric | Value | Reasoning |
|--------|-------|-----------|
| Users who share | ~5% | Only 3 of 7 screens have share triggers. Sharing requires intentional button tap. No sharing at emotional peaks. |
| Shares per sharing user | ~0.4 | Most sharers do it once. No recurring triggers beyond daily forecast. No variety in share formats. |
| Recipients who convert | ~10% | App Store link with no context, no deep linking, no personalized landing, no immediate value on download. |
| **Current K-factor** | **~0.002** | K = 0.05 × 0.4 × 0.10 = 0.002 |

**K-factor formula:** K = (% users who share) × (avg shares per sharing user) × (conversion rate per share recipient)

Current K = 0.002 → Every 1,000 users generate ~2 additional organic users. Effectively zero viral growth.

### After Tier 1-2 (Realistic Near-Term Target)

| Metric | Target | How |
|--------|--------|-----|
| Users who share | ~20% | 7 new share triggers at high-emotion moments (badge, level, streak, whisper, quote, transit, recap). Share prompts appear at arousal peaks. |
| Shares per sharing user | ~1.5 | Multiple share surfaces per session. Recurring triggers (daily insight, monthly recap, streak milestones). Variety in card formats (320px + story). |
| Recipients who convert | ~10% | Same as current — no deep linking yet in Tier 1-2. |
| **Target K-factor** | **~0.03** | K = 0.20 × 1.5 × 0.10 = 0.03 |

### After Tier 1-4 (Aspirational Full Implementation)

| Metric | Target | How |
|--------|--------|-----|
| Users who share | ~35% | Deep linking + referral rewards + cosmic events + Year Wrapped + invite codes + Mercury Rx cards. Multiple motivation types (identity, practical, social currency). |
| Shares per sharing user | ~3.0 | Compat invite (high-conversion 1:1), referral codes, event cards (monthly lunar + 3x/year retrograde), Year Wrapped (5-card sequence = 2-3 shares). |
| Recipients who convert | ~12% | Deep linking → instant value (see match result, see forecast). Personalized landing. Invite code → immediate compatibility reveal. |
| **Target K-factor** | **~0.126** | K = 0.35 × 3.0 × 0.12 = 0.126 |

### Viral Amplification Math

**Effective organic amplification formula:**

For K < 1: Total users per paid acquisition = 1 / (1 - K)

| Scenario | K-factor | Amplification | Effective CPI (at $3.50 paid) | CPI Savings |
|----------|----------|---------------|-------------------------------|-------------|
| Current | 0.002 | 1.002x (0.2%) | $3.49 | -$0.01 |
| Tier 1-2 | 0.03 | 1.031x (3.1%) | $3.40 | -$0.10 |
| Tier 1-3 | 0.08 | 1.087x (8.7%) | $3.22 | -$0.28 |
| Tier 1-4 | 0.126 | 1.144x (14.4%) | $3.06 | -$0.44 |

### Monthly Savings at Scale

| MAU | Monthly Paid Acquisitions (20% of MAU) | Organic Additions (K=0.126) | Monthly $ Saved | Annual $ Saved |
|-----|----------------------------------------|----------------------------|-----------------|----------------|
| 10K | 2,000 | 288 | $1,008 | $12,096 |
| 25K | 5,000 | 720 | $2,520 | $30,240 |
| 50K | 10,000 | 1,440 | $5,040 | $60,480 |
| 100K | 20,000 | 2,880 | $10,080 | $120,960 |

### Development Investment & Break-Even

**Total development cost estimate (Tier 1-4):**
- Tier 1: ~40 hours (5 features, 1-2 days each)
- Tier 2: ~60 hours (6 features, 3-5 days each)
- Tier 3: ~50 hours (3 features, 5-10 days each)
- Tier 4: ~60 hours (3 features + Year Wrapped)
- **Total: ~210 hours ≈ $21,000 at $100/hr**

| MAU | Monthly Savings (K=0.126) | Break-Even |
|-----|--------------------------|------------|
| 10K | ~$1,008/month | ~21 months |
| 25K | ~$2,520/month | ~8.3 months |
| 50K | ~$5,040/month | ~4.2 months |
| 100K | ~$10,080/month | ~2.1 months |

### Tier 1-2 Only (Quick Win Scenario)

If only Tier 1-2 is implemented (~100 hours, ~$10,000):

| MAU | Monthly Savings (K=0.03) | Break-Even |
|-----|--------------------------|------------|
| 10K | ~$200/month | ~50 months |
| 50K | ~$1,000/month | ~10 months |
| 100K | ~$2,000/month | ~5 months |

**The real value of Tier 1-2** isn't the direct CPI reduction — it's:
1. Building sharing habits that compound when Tier 3-4 are added
2. Brand awareness from share card visibility (unmeasured top-of-funnel)
3. Data collection on which share surfaces perform best (informing Tier 3-4 priorities)
4. Compatibility invite loops (Feature 11) which have much higher per-share conversion than broadcast shares

### Notes on These Estimates

- Estimates are conservative. They don't account for:
  - Network effects accelerating over time (K compounds as more users share)
  - Brand awareness from card visibility in social feeds (hard to measure, real impact)
  - Seasonal spikes (Mercury Rx, Year Wrapped) that temporarily increase K by 2-5x
  - Compatibility invite loops having 5-10x higher conversion than broadcast shares
- The K-factor targets assume steady-state behavior, not launch spikes
- Actual K will vary by user cohort, season, and feature adoption

---

## 7. Anti-Patterns

Critical rules to prevent dark patterns, user backlash, and app store policy violations. These are non-negotiable constraints on implementation.

### 7.1 Never Gate Features Behind Sharing

**Rule:** No feature, content, or functionality should require sharing to unlock. Sharing is always optional and never a prerequisite.

**Why:** Feature-gating creates resentment. Users who feel forced to share generate low-quality shares (shared to unlock, immediately deleted) and negative app reviews. Apple's App Store Review Guidelines (Section 3.2.2) explicitly prohibit requiring social sharing for app functionality.

**Violations (DO NOT BUILD):**
- "Share to unlock your daily forecast"
- "Share 3 times to see your full compatibility"
- "Invite a friend to access premium reports"
- "Share to reveal your cosmic whisper"

### 7.2 Maximum 1 Share Auto-Prompt Per Session

**Rule:** The `sharePromptService.js` rate limiter must enforce a maximum of 1 auto-prompted share suggestion per app session, with a 24-hour cooldown between auto-prompts.

**Why:** Multiple prompts per session create "notification fatigue" applied to sharing. Users dismiss share prompts reflexively, reducing effectiveness of ALL future prompts. Reactance theory (Brehm, 1966) shows that perceived pressure to perform an action reduces willingness to comply.

**Critical Distinction:**
- **Auto-prompts** (app suggests sharing — badge modal, level-up modal, streak milestone modal, high compat score prompt): **RATE-LIMITED** to 1/session, 24hr cooldown
- **Manual shares** (user taps a share button — "Share My Chart," "Share to Stories," tap-to-share on quotes, "Invite Friend"): **NOT rate-limited**, always available
- The key question: **who initiated?** If the app suggests → rate-limit. If the user seeks → allow.

### 7.3 Cards Must Feel Like USER Content, Not App Ads

**Rule:** Share cards should be designed so that they feel like the user's personal expression, not an advertisement for Celestia.

**Why:** When shared content feels like an ad, recipients ignore it and sharers feel embarrassed. When it feels like the user's own self-expression, it gets engagement and the sharer feels proud. This is the difference between "My friend shared their zodiac identity" and "An app is advertising at me through my friend."

**Design Principles:**
- User's name/data should be the visual focus (largest element)
- App branding (`ShareWatermark`) should be subtle — small, reduced opacity, bottom of card
- No "Download Celestia" CTAs ON the card (the watermark handles attribution subtly)
- No promotional language ("Try Celestia!" / "Get your free reading!")
- Color palette should feel premium and personal (navy/gold/cream), not promotional (red/yellow/bold)
- Typography should be elegant (Playfair/DM Sans), not marketing-loud
- No app icon or logo visible on the card face

### 7.4 No "Share to Unlock" or Forced Progression

**Rule:** XP rewards for sharing (via `awardXP('share')`) are bonuses, not requirements. No level, badge, or feature should be practically unreachable without sharing.

**Why:** If sharing XP is necessary for progression, it creates coerced sharing which violates 7.1. The XP per share is a pleasant bonus, not a requirement.

**Verification:** Calculate whether Cosmos level (highest) is reachable purely through non-share actions (daily check-in, journal, chat, deep dive, report, compatibility). If yes, sharing XP is a bonus. If no, reduce sharing XP requirement or increase non-share XP rates.

**Current XP Actions (from `levels.js`):**
- Daily check-in: +10, Journal: +20, Report: +15, Chat: +5, Share: +25, Deep dive: +10, Compatibility: +15
- With streak multipliers (up to 1.5x) and first-action bonuses (2x), a daily user earns ~50-100 XP/day without sharing
- Cosmos (highest level) should be reachable within 6-12 months of daily use without any shares

### 7.5 Native Share Sheet Only — No Social Account Requirements

**Rule:** All sharing must use the native share sheet (`Share.share()` / `expo-sharing`). Never require users to connect social media accounts, grant social API permissions, or log in to third-party services.

**Why:** Social account connections create friction (extra login step), privacy concerns (data sharing with platforms), and platform dependency (API changes break features). The native share sheet lets users choose their preferred destination (iMessage, WhatsApp, Instagram, email, AirDrop, etc.) without Celestia needing any social media API access.

**No exceptions.** Even the referral system should use shareable links via native share sheet, not social API integrations.

### 7.6 No Public Share Counters or Sharing Leaderboards

**Rule:** Never display a user's share count publicly or create leaderboards around sharing activity.

**Why:** Share counters create social pressure and gamify sharing in ways that feel manipulative. They also reveal the app's intent (maximize shares) rather than respecting the user's intent (express identity). The badge system (Constellation at 5 shares, Galaxy Spreader at 25) is an internal reward visible only to the user — not a public competition.

**Acceptable:** Badge icons displayed in user's own badge grid (ProfileScreen). Private progress toward next share badge.
**Not acceptable:** "You've shared 17 times" counter, "Top sharers this week" leaderboard, share count on profile visible to others.

### 7.7 Respect Emotional Context — No Tone-Deaf Prompts

**Rule:** Share auto-prompts should match the emotional context. Never interrupt negative, reflective, or vulnerable moments with share CTAs.

**Do NOT auto-prompt sharing:**
- During a heavy transit reading about challenges or difficulties
- After a journal entry about difficult emotions
- After viewing a low compatibility score (<50%) — manual share button is OK, but don't auto-suggest
- In WelcomeBackModal for returning users (they may feel guilt about absence)
- During report sections about personal challenges

**OK to auto-prompt:**
- After badge unlock (high arousal, positive)
- After level-up (achievement, positive)
- After streak milestone (pride, positive)
- After high compatibility score reveal (>85%, excitement)

### 7.8 No Deceptive Preview Text or Clickbait

**Rule:** Share preview text (the text that accompanies shared images/links) must accurately represent the content. No clickbait, misleading claims, or manufactured urgency.

**Violations (DO NOT USE):**
- "You won't believe what the stars say about you"
- "URGENT: Your cosmic reading expires in 24 hours"
- "Your compatibility result SHOCKED me"
- "The universe has a WARNING for you"

**Acceptable:**
- "My cosmic identity: Capricorn Sun, Pisces Moon, Scorpio Rising"
- "Mercury retrograde survival tips for the next 3 weeks"
- "Our compatibility: 87%"
- "30-day cosmic streak! Here's what I've learned"

---

## 8. Implementation Sequencing

6-week rollout ordered by impact/effort ratio. Each week builds on the previous.

### Week 1: Foundation + Quick Wins
**Theme:** Activate existing assets, establish rate limiter, plug the biggest gaps.

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1 | **F5:** `sharePromptService.js` rate limiter | Create: `src/services/sharePromptService.js` | 0.5 day |
| 1-2 | **F1:** Badge share button + `BadgeShareCard` | Modify: `BadgeUnlockModal.js` (add share btn at line 51); Create: `BadgeShareCard.js` | 1.5 days |
| 2-3 | **F2:** Tap-to-share on deep dive `share_quote` | Modify: `ChartScreen.js` (wrap line 530-534 in TouchableOpacity) | 1 day |
| 3-4 | **F3:** MonthlyRecapCard integration on HomeScreen | Modify: `HomeScreen.js` (add date check + recap section); Uses existing `MonthlyRecapCard.js` | 1.5 days |
| 4-5 | **F4:** "Share My Chart" + `BigThreeShareCard` | Create: `BigThreeShareCard.js`; Modify: `ChartScreen.js` (add btn after line 257) | 1.5 days |

**Week 1 Deliverables:**
- Share rate limiter operational (infrastructure for Tier 2)
- Badge unlock modal has share button (highest-impact gap closed)
- Chart deep dive quotes are tappable (10 new share points per user)
- Monthly recap renders on 1st-3rd of month with share (12 annual moments)
- Big Three share card on ChartScreen (most common astrology sharing behavior)
- **New share surfaces: +4** | **Total: 9** | **Screens with sharing: 5/7**

### Week 2: Celebration Modals + Whisper
**Theme:** Capture high-emotion moments that currently have zero sharing.

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1-2 | **F6:** `StreakMilestoneModal` + `StreakShareCard` | Create: `StreakMilestoneModal.js`, `StreakShareCard.js`; Modify: `HomeScreen.js` (check milestone after check-in) | 2 days |
| 2-3 | **F7:** `LevelUpModal` + `LevelUpShareCard` | Create: `LevelUpModal.js`, `LevelUpShareCard.js`; Modify: `HomeScreen.js` (check `leveledUp` from `awardXP()`) | 2 days |
| 4-5 | **F8:** Whisper share + `WhisperShareCard` | Create: `WhisperShareCard.js`; Modify: `HomeScreen.js` (add TouchableOpacity to whisper at line 816-827) | 1.5 days |

**Week 2 Deliverables:**
- Streak milestone celebrations with share (7 milestones: 3/7/14/30/50/100/365)
- Level-up celebrations with share (4 level-up moments per user lifetime)
- Cosmic whisper sharing with rarity badges
- **New share surfaces: +3** | **Total: 12** | **Screens with sharing: 5/7**

### Week 3: Platform + Screen Coverage
**Theme:** Expand to story format and cover TransitsScreen (currently 0 sharing).

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1-2 | **F10:** Transit share + `TransitShareCard` | Create: `TransitShareCard.js`; Modify: `TransitsScreen.js` (add btn to expanded cards at line 262-326) | 2 days |
| 3-4 | **F9:** Story-format `DailyStoryCard` (1080x1920) | Create: `DailyStoryCard.js`; Modify: `HomeScreen.js` (add "Share to Stories" option) | 2 days |
| 5 | **F14:** `CosmicRarityCard` | Create: `CosmicRarityCard.js`; Modify: `ChartScreen.js` + `ProfileScreen.js` (add access points) | 1 day |

**Week 3 Deliverables:**
- TransitsScreen has sharing capability (was the only major screen with zero sharing)
- Story-format daily card for Instagram Stories (2-3x engagement vs square format)
- Cosmic rarity card accessible from Chart + Profile
- **New share surfaces: +3** | **Total: 15** | **Screens with sharing: 6/7**

### Week 4: Highest-Conversion Viral Loop
**Theme:** Build the compatibility invite code system — the strongest single viral mechanism.

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1-3 | **F11:** Compatibility invite code system | Create: `inviteService.js`; Modify: `CompatibilityScreen.js` (add invite button after score reveal) | 3 days |
| 4-5 | Contextual share auto-prompts at emotional peaks | Modify: `HomeScreen.js` (whisper), `CompatibilityScreen.js` (85%+ score prompt); Wire through `sharePromptService` | 2 days |

**Week 4 Deliverables:**
- Compatibility invite codes shareable via native share sheet
- Contextual auto-prompts at high-compat scores and emotional peaks
- **New share surfaces: +1** | **Total: 16**

### Week 5: Deep Linking + Referrals
**Theme:** Infrastructure for viral growth — make shared links actually work.

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1-3 | **F12:** Deep linking infrastructure | Create: `deepLinkService.js`; Modify: `app.json` (associated domains), `AppNavigator.js` (linking config) | 3 days |
| 3-5 | **F13:** Referral reward system | Create: `referralService.js`; Modify: `ProfileScreen.js` (add "Invite Friends" section), `badges.js` (add Cosmic Connector + Star Network) | 2.5 days |

**Week 5 Deliverables:**
- Universal links working (iOS)
- App links working (Android)
- Referral codes with 100 XP mutual reward
- "Cosmic Connector" (3 referrals) + "Star Network" (10 referrals) badges
- **Infrastructure: Deep linking live, referral system active**

### Week 6: Event Cards + QA
**Theme:** Time-limited viral moments + end-to-end quality assurance.

| Day | Feature | Key Files | Effort |
|-----|---------|-----------|--------|
| 1-2 | **F15:** Mercury Rx Survival Kit card | Create: `MercuryRxCard.js`; Modify: `HomeScreen.js` or `TransitsScreen.js` | 2 days |
| 2-3 | **F16:** Eclipse/Full Moon event cards | Create: `LunarEventCard.js`; Modify: `HomeScreen.js` | 1.5 days |
| 4-5 | QA: End-to-end testing | Test all share flows: capture quality, share sheet behavior, rate limiter enforcement, XP/badge tracking per share, deep link routing, invite code redemption | 2 days |

**Week 6 Deliverables:**
- Mercury Rx card ready for next retrograde period (~3x/year)
- Lunar event cards active for monthly full/new moons + eclipses
- All share flows tested end-to-end
- **New share surfaces: +2** | **Total: 18** | **Screens with sharing: 7/7**

### Post-Week 6: Cosmic Year Wrapped (Feature 17)

**Timeline:** 2-3 weeks of dedicated development, targeted for late November ship.
**Scope:** `yearWrappedService.js` for data aggregation + `CosmicYearWrapped.js` for 5-card swipeable UI + per-card sharing + time-limited availability window (Dec 15 - Jan 15).
**Dependencies:** Requires 6+ months of user data to generate meaningful stats. Begin data aggregation early (Week 1), ship the UI in Year 1 November.

### Cumulative Progress

| Week | New Surfaces | Cumulative Surfaces | Screens w/ Sharing | K-factor (est.) |
|------|-------------|--------------------|--------------------|-----------------|
| 0 (current) | — | 5 | 3/7 | ~0.002 |
| 1 | +4 | 9 | 5/7 | ~0.01 |
| 2 | +3 | 12 | 5/7 | ~0.02 |
| 3 | +3 | 15 | 6/7 | ~0.025 |
| 4 | +1 | 16 | 6/7 | ~0.03 |
| 5 | +0 (infra) | 16 | 6/7 | ~0.06 |
| 6 | +2 | 18 | 7/7 | ~0.08 |
| Post-6 | +1 (Wrapped) | 19 | 7/7 | ~0.10+ |

---

## Appendix: Complete File Reference

### A. Existing Infrastructure (Reuse — Do Not Rebuild)

| File | Purpose | Key Exports / Details |
|------|---------|----------------------|
| `src/components/ShareCard.js` | Share utility hook | `useShareCard()` → `{ cardRef, captureAndShare }`, `ShareWatermark` component |
| `src/components/DailyShareCard.js` | Daily forecast card | 320px, sun glyph + viral insight/mantra + date, gradient `['#0E0E22', '#1A1535', '#0F1628']` |
| `src/components/CompatibilityShareCard.js` | Compat score ring card | 320px, SVG ring (r=40, gold stroke), user/partner names, score%, verdict |
| `src/components/MatchStoryCard.js` | Story-format compat card | 360x640, 4 themes (Aura/Golden/Midnight/Rosé), `STORY_THEMES` export, score 96pt, progress bar 160px |
| `src/components/CosmicIDCard.js` | Identity card | 320px, Big Three columns, element chips (gold pills), level name |
| `src/components/MonthlyRecapCard.js` | Monthly recap card | 320px, accepts `{ recap, month, year, streakDays, journalEntries, sunSign }` — **BUILT, NOT INTEGRATED** |

### B. Screens to Modify

| File | Planned Modifications |
|------|----------------------|
| `src/screens/HomeScreen.js` | MonthlyRecap integration (F3), whisper share (F8), streak modal (F6), level-up modal (F7), Mercury Rx card (F15), lunar events (F16), story daily (F9) |
| `src/screens/ChartScreen.js` | Tap-to-share quote at line 530 (F2), "Share My Chart" button after line 257 (F4), cosmic rarity access (F14) |
| `src/screens/TransitsScreen.js` | Transit share card + button at line 262-326 (F10) |
| `src/screens/CompatibilityScreen.js` | Invite code system (F11), high-score auto-prompt |
| `src/screens/ProfileScreen.js` | Referral section (F13), cosmic rarity access (F14), streak share |

### C. Components to Modify

| File | Modification |
|------|-------------|
| `src/components/BadgeUnlockModal.js` | Add "Share" button before "Continue" at line 51 (F1) |

### D. Engagement Services (Wire Into New Share Points)

| File | Relevant API | Purpose |
|------|-------------|---------|
| `src/services/achievementService.js` | `trackEvent('share')` | Increments `shares` counter; unlocks Constellation (5) + Galaxy Spreader (25) |
| `src/services/xpService.js` | `awardXP(id, 'share')` | Awards XP, applies streak multiplier + first-action bonus, returns `{ leveledUp, newLevel }` |
| `src/services/cosmicIdentityService.js` | `getCosmicArchetype(chart)` | Returns `{ name, tagline, rarity, elements, dominanceRatio }`. `getComboRarity()` returns "1 in X" |
| `src/services/cosmicWhisperService.js` | `getCosmicWhisper()` | Returns `{ message, rarity }` or null. Tiers: Common (96.5%), Rare (3%), Ultra-Rare (0.5%) |
| `src/services/streakService.js` | `getMilestoneMessage(n)`, `getStreakEmoji(n)` | Milestone messages for 3/7/14/30/50/100/365; emojis by tier |
| `src/services/astrologyService.js` | `isMercuryRetrograde()`, `getActiveCosmicWindows()` | Retrograde detection, cosmic window detection |

### E. New Files to Create

| File | Feature | Tier | Week |
|------|---------|------|------|
| `src/services/sharePromptService.js` | Rate limiter (max 1/session, 24hr cooldown) | 1 | 1 |
| `src/components/BadgeShareCard.js` | Badge unlock share card (320px) | 1 | 1 |
| `src/components/BigThreeShareCard.js` | Big Three + rarity share card (320px) | 1 | 1 |
| `src/components/StreakMilestoneModal.js` | Streak celebration modal | 2 | 2 |
| `src/components/StreakShareCard.js` | Streak milestone share card (320px) | 2 | 2 |
| `src/components/LevelUpModal.js` | Level-up celebration modal | 2 | 2 |
| `src/components/LevelUpShareCard.js` | Level-up share card (320px) | 2 | 2 |
| `src/components/WhisperShareCard.js` | Cosmic whisper share card (320px) | 2 | 2 |
| `src/components/DailyStoryCard.js` | Story-format daily (360x640) | 2 | 3 |
| `src/components/TransitShareCard.js` | Transit insight share card (320px) | 2 | 3 |
| `src/components/CosmicRarityCard.js` | Archetype + rarity share card (320px) | 3 | 3 |
| `src/services/inviteService.js` | Compatibility invite codes | 2-3 | 4 |
| `src/services/deepLinkService.js` | Universal/app link handling | 3 | 5 |
| `src/services/referralService.js` | Referral code + reward system | 3 | 5 |
| `src/components/MercuryRxCard.js` | Mercury Rx survival kit card (360x640) | 4 | 6 |
| `src/components/LunarEventCard.js` | Eclipse/full moon event cards (360x640) | 4 | 6 |
| `src/components/CosmicYearWrapped.js` | Annual 5-card story sequence (360x640 each) | 4 | Post-6 |
| `src/services/yearWrappedService.js` | Annual data aggregation service | 4 | Post-6 |
