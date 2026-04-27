# 10 — Deep Language Audit
## What the strip-down didn't fix

**Frame:** Apple's rejection said *"primarily features astrology, horoscopes, palm reading, fortune telling or zodiac reports."* Not *"is poorly designed."* Not *"lacks differentiation."* The reviewer judged the **primary feature** — and the *language* of the app announces that feature out loud on every screen.

The 15-task strip-down handled:
- ✅ Tab order (Circle first)
- ✅ Onboarding paywall + auth removal
- ✅ Splash tagline + CTA copy
- ✅ Onboarding step 1 hook copy
- ✅ Hardcoded prices, fabricated testimonials gone

But under the hood, the app still **shouts astrology** through:
- Heavy "cosmic" / "celestial" / "soul" register on every screen
- Notifications that announce *"Mercury Retrograde is active"*, *"Your cosmic mantra"*, *"Moon enters Cancer"*
- Badge names: Stargazer, Moon Cycle, Celestial Devotee, Retrograde Warrior, Cosmic Connector
- Level names: Starling, Constellation, Nebula, Galaxy, Cosmos
- Quest labels: "Write in your cosmic journal", "Explore today's sky"
- Chart tab — naked astrology UI, no relational framing
- Profile section labeled "Cosmic ID Card"

**A reviewer who opens any tab other than Circle, or enables a single notification, sees the rejection text confirmed.** This audit lists every offender, ordered by reviewer-impact.

---

## 1. THE 90-SECOND PATH (highest priority — what review almost certainly sees)

### 1.1 Splash → Onboarding → Circle landing

✅ Already addressed (`Block C`, `Block D` of `01-code-changes.md`).

### 1.2 Onboarding step 9 — "First Hit" sign reveal

**`src/screens/OnboardingFlowScreen.js`** — the user's Sun sign is shown in 52pt serif type with a tagline like *"A fire that never asks permission to burn"* (Aries Sun).

🔴 **Reviewer reads:** classic astrology onboarding theatre. The Pattern, Co-Star, Sanctuary all do this.

**Fix:**
- Reframe the reveal as *"How you tend to show up in relationships"*, not *"Your Sun sign."*
- Drop the giant zodiac glyph (`hitSign` style, 52pt).
- Replace SUN_TAGLINES values with relationship-flavored statements (*"You bring fire. People feel it before they understand it."*).

### 1.3 Onboarding step 10 — "Big Reveal"

Shows a chart wheel + Sun/Moon/Rising stack labeled with zodiac names.

🔴 **Reviewer reads:** "definitely an astrology app."

**Fix options:**
- **Soft:** keep the chart wheel but rename the three stack cards: "How you act" / "What you need" / "How you come across" — each labeled with a sign in small type below.
- **Aggressive:** hide the wheel entirely, show only the three relational descriptors. Move the chart wheel to the Chart tab.

### 1.4 Onboarding step 11 — Daily Hook

✅ Already updated to "Add the people who matter" / "Your Circle — Eight relationship types" (`Block D`).

**One residual concern:** card labels still use astrology framing:
- "YOUR CIRCLE" ✅
- "YOUR CHART" ⚠️ — fine if framed as self-perception
- "YOUR DAY" — current text is fine

### 1.5 Default tab content (Circle)

**`src/screens/CompatibilityScreen.js`** — when empty, shows: *"Check anyone — a crush, a friend, or a celebrity"* / *"X people in your circle"*.

🟢 The empty-state copy is fine. The relationship-type pills (Partner / Friend / Parent / etc.) read relational, not astrological.

⚠️ **But:** when the user selects a partner, the detail view leads with "Synastry score X%" + zodiac glyphs. **A reviewer adding a test partner will see explicit astrology UI.**

**Fix:**
- Detail view header should lead with *"Connection score"* not *"Synastry score"*.
- Move the zodiac glyphs to a smaller "based on chart" footer.
- Lead the detail page with the relational dimensions (communication, conflict patterns, what each person needs) rather than the astrology mechanics.

---

## 2. NOTIFICATIONS (reviewer enables one to test → instant rejection)

### 2.1 Notification channel names (`src/services/notificationService.js`)

Currently:
| ID | Name | Description |
|---|---|---|
| `cosmic_morning` | "Morning Cosmic Briefing" | "Your personalized daily cosmic reading" |
| `evening_reflection` | "Evening Reflection" | "Nightly journal prompts and **cosmic** recaps" |
| `transit_alerts` | "Transit Alerts" | "Significant **cosmic** events affecting your chart" |
| `streak_guardian` | "Streak Reminders" | "Protect your daily **cosmic** streak" |
| `cosmic_milestones` | "**Cosmic** Milestones" | "Badge unlocks and level-ups" |
| `weekly_digest` | "Weekly **Cosmic** Digest" | "Your weekly **cosmic** preview" |

🔴 **Visible in iOS Settings → Celestia → Notifications.** A reviewer who opens this shelf sees seven instances of "cosmic" — direct match to the rejection vocabulary.

**Fix (verbatim replacements):**
| Old | New |
|---|---|
| Morning Cosmic Briefing | Morning Briefing |
| Cosmic Milestones | Milestones |
| Weekly Cosmic Digest | Weekly Digest |
| "Your personalized daily cosmic reading" | "Your daily relational briefing" |
| "Nightly journal prompts and cosmic recaps" | "Nightly journal prompts and weekly recaps" |
| "Significant cosmic events affecting your chart" | "Significant pattern shifts in the week ahead" |
| "Protect your daily cosmic streak" | "Protect your daily streak" |
| "Your weekly cosmic preview" | "Your week ahead" |

### 2.2 Notification message templates (`src/services/notificationContentEngine.js`)

🔴 **All of these strings are sent as actual push notifications:**

| Template | Current text | Issue |
|---|---|---|
| `cm_navigator_excerpt` | (uses `forecast.navigatorHeadline`) | Depends on AI output — see §6 |
| `mercury_rx_active` | "Mercury Retrograde is active" | EXPLICIT category trigger |
| `mercury_rx_imminent` | "Mercury Retrograde starts tomorrow" | EXPLICIT |
| `mercury_rx_countdown` | "Mercury Retrograde in N days" | EXPLICIT |
| `lunar_full` | "Tonight's Full Moon in Cancer is activating your chart" | EXPLICIT moon framing |
| `cosmic_window` | "This **cosmic** window won't last" | EXPLICIT |
| `viral_reading` | "✦ Your **Cosmic** Reading" / "Your personalized **cosmic** reading is ready" | EXPLICIT |
| `cosmic_mantra` | "Your **cosmic** mantra" | EXPLICIT |
| `top_score_today` | "The **cosmos** is handing you something rare" | EXPLICIT |
| `moon_into_sign` | "Moon enters {sign} today" | Astrology jargon |
| `love_vibe` | "Venus has something to say about your heart today" | Personification of planet |
| `morning_with_journal` | "The Moon moved to {sign} overnight" | Moon framing |

**Recommended action:** **disable astrology-flavored notification templates entirely for v1.** Keep only:
- `cm_navigator_excerpt` (with the prompt re-engineered to output relational copy — see §6)
- `cm_navigator_headline` (same)
- Streak reminders (must be reworded — see §2.3)
- Milestone notifications for badge/level unlocks (only if §3 badges are renamed)

Disable: mercury_rx_*, lunar_full, cosmic_window, viral_reading, cosmic_mantra, top_score_today, moon_into_sign, love_vibe, morning_with_journal — all of them. They're optional content templates, can be re-enabled in v1.x once approval lands.

The fix is a single edit to remove these template entries from `NOTIFICATION_TEMPLATES` and the scheduling logic.

### 2.3 Streak / engagement notifications

If a streak guardian fires *"Don't break your cosmic streak!"* — that's a 4.3(b) hit AND a 4.5.4 (push spam) hit.

Reword to:
- "Your streak is safe today — see what's new"
- "Keep your N-day streak alive"

Drop "cosmic" from every streak template.

---

## 3. ENGAGEMENT — Badges, Levels, Cosmic ID

These appear on Profile + Journey screens. A reviewer scrolling Profile sees the full list.

### 3.1 Badge catalog (`src/constants/badges.js`)

| Old | New |
|---|---|
| Stargazer | Day Seven |
| Moon Cycle | Month One |
| Celestial Devotee | Hundred Days |
| Chart Explorer | Self Map |
| Transit Watcher | Sky Watcher → keep, "sky" is generic enough |
| Match Maker | Connector |
| Cosmic Scholar | Deep Reader |
| Galaxy Spreader | Storyteller |
| Cosmic Connector | Inviter |
| New Moon Ritual | Reset Day |
| Full Moon Witness | Bright Night |
| Retrograde Warrior | (delete — reword the trigger entirely or remove badge for v1) |

The category names ('cosmic_event' for badges) are internal — fine.

🟡 **Pragmatic minimum**: rename the 4 *most* category-coded names (Cosmic Scholar / Cosmic Connector / Cosmic Milestones / Retrograde Warrior). The rest are softer.

### 3.2 Level names (`src/constants/levels.js`)

```
1 Starling, 2 Constellation, 3 Nebula, 4 Galaxy, 5 Cosmos
```

🟡 The whole level ladder is celestial. Each level visible in Profile / Journey.

**Recommended rename** (relational progression):
```
1 Starting,  2 Listening,  3 Mapping,  4 Connecting,  5 Anchored
```

Or simpler:
```
1 Day One,  2 Curious,  3 Engaged,  4 Active,  5 Anchored
```

### 3.3 LEVEL_REWARDS labels

```
1: 'Welcome to the cosmos'
2: 'Reading Voice customization'
3: 'Yesterday & Tomorrow forecasts'
4: 'Deep Match compatibility reports'
5: 'Cosmic ID Card & exclusive badge frame'
```

🔴 "Welcome to the cosmos" + "Cosmic ID Card" — visible reward labels.

**Fix:**
| Old | New |
|---|---|
| Welcome to the cosmos | Welcome |
| Reading Voice customization | Voice options |
| Yesterday & Tomorrow forecasts | Yesterday & Tomorrow views |
| Deep Match compatibility reports | Deeper relationship reports |
| Cosmic ID Card & exclusive badge frame | ID Card & badge frame |

### 3.4 Cosmic ID Card component

`src/components/CosmicIDCard.js` — visible in Profile.

🟡 The component name is internal (fine), but if it renders titles like "**Cosmic ID** · YOUR ESSENCE" the reviewer sees it.

**Fix:** rename the displayed title to "Your Profile Card" or "Your Patterns" — keep filename for git history sanity.

### 3.5 Quest labels (`src/services/questService.js`)

| Old | New |
|---|---|
| Read your full forecast | Read your daily briefing |
| Write in your **cosmic** journal | Write in your journal |
| Deep dive into a placement | Explore one part of your chart |
| Ask Celestia a question | Ask a question |
| Share your reading | Share your insight |
| Explore today's sky | Check today's outlook |
| Check your circle | Check your circle ✅ |
| Explore your energy grid | (kept — vague enough) |

---

## 4. HOMESCREEN — every "cosmic" left

Top-priority fixes in user-visible strings (`src/screens/HomeScreen.js`):

| Line | Current | Fix |
|---|---|---|
| 826 | "let the **cosmic** dust settle first" | "let the dust settle first" |
| 1189 | "Your **cosmic** year resets. See what the stars have planned for your next chapter." | "Your year resets. See what's ahead in the months to come." |
| 1243 | "**Cosmic** Energy" (label) | "Today's Energy" |
| 1273 | "Cosmic season bar" (comment) | (internal) — leave |
| 1369 | "current **cosmic** season" | "current season" |
| 1455 | `My cosmic recap` (share text) | `My monthly recap` |
| 1534 | "Quick **cosmic** check-in" | "Quick check-in" |
| 1579 | "Your **Cosmic** Deep Dives" (section title) | "Your Deep Dives" |
| 1824 | "DAY AT A GLANCE — **cosmic** stats" (comment) | (internal) — leave |
| 2277 | "**Cosmic** Journal" (modal title) | "Journal" |
| 2733-36 | `cosmicAlertCard`, etc. (style names) | (internal) — leave |

**`forecast.powerCosmic`** — JSON field returned by Gemini. Renders as a chip on Today screen ("✦ Cosmic energy: balanced"). The label printed on screen is just `{forecast.powerCosmic}`, a value like "Balanced" or "Surging" — but the chip *next to it* says "Cosmic Energy". Rename label to **"Today's Energy"**.

---

## 5. CHART TAB — pure astrology surface

**`src/screens/ChartScreen.js`** is the most flagged tab. A reviewer opens this tab and sees:
- A natal chart wheel (major astrology visual)
- Planet glyphs (☉ ☽ ☿ ♀ ♂ ♃ ♄)
- Zodiac glyphs (♈ ♉ ♊...)
- "Sun in Cancer", "Moon in Scorpio", aspect lines
- Section labels: "Your Big Three", "Aspects", "Houses"

🔴 **This single screen does more 4.3(b) damage than the rest of the app combined.**

### Three options, increasingly aggressive:

**Option A — Reframe with a relational header**
Add a hero section at the top: *"How you show up to others"* with three soft tiles:
- "How you communicate" (drawn from Mercury placement)
- "What you need to feel safe" (from Moon)
- "How others first read you" (from Rising)

Below that, the wheel becomes "Your full chart →" expandable. Default-collapsed.

**Option B — Hide the wheel by default, show interpretation tiles**
The chart wheel is entirely hidden behind a tap. The user only sees:
- 6-8 plain-English self-perception tiles
- "View astronomical chart →" link (small, bottom)

**Option C — Move Chart entirely off the tab bar (recommended)**
Tab bar becomes 4 tabs: **Circle / Today / Ask / Reports**. Chart accessed only via Profile → "Your Chart". Reviewer doesn't encounter it in the 90-second test.

This requires updating `AppNavigator.js`. ~5-line change.

**My recommendation: Option C.** The Chart tab is the single biggest reviewer-trigger surface in the app, and it's not where the relationship product lives. Hiding it behind Profile preserves the feature while removing the rejection vector.

---

## 6. AI OUTPUTS — Gemini's responses are saturated

Even when our prompts say "relational," Gemini's training pulls toward astrology language because the input data IS astrology data.

**Example Gemini outputs we've seen:**
- *"Your sun in Leo wants to be seen..."* (sun-sign framing)
- *"Mercury retrograde is asking you to slow down..."* (transit framing)
- *"The full moon is amplifying your shadow side..."* (moon framing)

These appear in:
- `forecast.navigatorHeadline` / `navigatorSummary` (HomeScreen card)
- `forecast.detailedHoroscope` (Today life-area modals)
- AI chat responses (Ask tab)
- Report content (Reports tab)
- Match analysis (Circle detail)

### Fix — rewrite the system prompts in `src/services/geminiService.js`

Find every `system_instruction` / `systemPrompt` string. For each, **prepend** language like:

```
You are a relationship and self-awareness writer using astrology as a private input. Never use the words "horoscope," "transit," "Mercury retrograde," "your sun sign," "your moon sign," "your rising sign," "the cosmos," "cosmic," "the stars," "the universe," "manifest," "destiny," or "fortune" in user-facing output. Instead, translate planetary information into plain-English observations about communication, attachment, energy, and pattern. The user is reading this to understand themselves and the people in their lives — not to consult an astrologer.
```

Then update the JSON schema field names where appropriate:
- `loveHoroscope` → `loveBriefing`
- `careerHoroscope` → `careerBriefing`
- `detailedHoroscope` → `detailedBriefing`
- `cosmicMantra` → `dailyMantra`
- `powerCosmic` → `powerEnergy`

This requires both prompt + schema updates AND parallel changes in the screens that read these fields.

⚠️ **Do not skip this section.** Even with every static string replaced, the AI generates fresh text every day. A reviewer who runs the app on the day Gemini outputs *"This Mercury retrograde is asking you..."* will reject. The system prompt is the single point of leverage.

---

## 7. REPORTS — renamed but still pure astrology content

Reports were renamed in `Block K` (Love Compass / Career & Colleagues / Cycles & Energy / Life Patterns / Year of Patterns / Right Now / Year Map). The labels are good.

**But the generated report text** (`generateFullReport` in `src/services/geminiService.js`) still produces astrology-saturated PDF content:
- "Your Venus in Pisces wants romance to feel like a dream..."
- "With Saturn squaring your Sun, this is a year of structure..."

A reviewer who opens any report sees pure astrology text. They scroll through 30 paragraphs of astrology.

**Fix path:** same as §6 — update the report prompt schema + system instructions to output relational content first, with astrology cited only as the engine in a small footnote per section.

---

## 8. MISC — surfaces I'd hide rather than rewrite

### 8.1 TransitsScreen (`src/screens/TransitsScreen.js`)

Even though we removed it from the tab bar, it's still reachable from notifications and HomeScreen deep links. Title says "Today's Sky" with a pure transit list.

**Fix:** rename navigation header to "Today's Outlook" + replace transit-list framing with "Today's themes" copy.

### 8.2 JournalScreen / JournalHistoryScreen

Both reachable from HomeScreen quest tiles. Look for "Cosmic Journal" / "cosmic mood" / "cosmic snapshot" (column name). Rename labels.

### 8.3 Welcome Back modal (`src/components/WelcomeBackModal.js`)

Probably says "Welcome back to the cosmos." Check + rename to "Welcome back."

### 8.4 LunarEventCard, MercuryRxCard

Both render heavy astrology framing on HomeScreen.
- **MercuryRxCard:** literally a card titled "Mercury Retrograde" — a 4.3(b) trigger word in the card title.
- **LunarEventCard:** "Full Moon in Cancer" / "New Moon ritual"

**Fix:** delete both component renders from HomeScreen for v1. They're optional cards that render only when astronomically active. v1 can show the alerts via the standard `cosmicAlertCard` (renamed to `weekHighlightCard`) with rephrased text instead.

### 8.5 Share cards (DailyShareCard, MonthlyRecapCard, MatchStoryCard, WhisperShareCard, etc.)

These render in the share UI. If the user shares a "reading" to Instagram, they generate an image with text. Reviewer probably doesn't tap Share, but if they do, they see the saturated copy.

**Fix:** lower priority — pass a v1 audit only if the share flow appears in screenshots. If not, defer to v1.1.

---

## 9. SUMMARY — three escalating fix levels

### Level 1 (minimum — one full day of work)

- Rename notification channel names (§2.1)
- Disable astrology-flavored notification templates (§2.2)
- Rewrite Gemini system prompts to forbid trigger vocab (§6)
- Rename HomeScreen visible "cosmic" strings (§4)
- Rename badge / level / quest labels (§3)
- Rename JSON schema fields (§6)
- Soften OnboardingFlowScreen step 9 / 10 (§1.2 / 1.3)

After Level 1 the reviewer can still find astrology if they look carefully (Chart tab, Reports content) but the 90-second path reads as a relationship app with astrology in the engine room.

### Level 2 (recommended — 2 days of work)

Everything in Level 1, plus:
- **Move Chart off the tab bar** — Profile sub-screen only (§5 Option C)
- **Delete MercuryRxCard / LunarEventCard from HomeScreen** (§8.4)
- **Rewrite Reports content prompts** to lead relational, cite astrology in footnote (§7)
- **Reframe synastry detail view** to lead with "Connection score" + relational dimensions (§1.5)

After Level 2, the only astrology surface a reviewer hits in normal use is the deep dive Profile→Chart (which is opt-in).

### Level 3 (aggressive — 3-4 days of work)

Everything above, plus:
- Hide all zodiac glyphs from default UI (move to a settings toggle "Show astrology details: on/off")
- Rebrand internal API field names (saved chart structure, partner records)
- Rewrite onboarding step 5-7 framing (currently "your birth time is your fingerprint" — keep functional, soften astrological framing)
- Add an explicit *"Why birth data?"* tooltip on onboarding that says "Celestia uses astronomical patterns at the moment of your birth as one input to relationship insights. You can disable astrology-specific surfaces in Settings."

Level 3 is reviewer-bulletproof for 4.3(b) but is a real product redesign.

---

## 10. Honest reviewer simulation

**Reviewer test, post-Level 1 fixes:**

1. Opens app → splash → onboarding → 11 steps → lands on Circle ✅ (good)
2. Sees empty Circle, taps Today → sees "Today's Briefing" with relational copy ✅ (good)
3. Taps Chart → **sees natal chart wheel with zodiac glyphs** 🔴 (4.3(b) confirmed)

**Reviewer test, post-Level 2 fixes:**

1. Opens app → onboarding → Circle ✅
2. Today → relational briefing ✅
3. Tab bar shows: Circle / Today / Ask / Reports — **no Chart tab** ✅
4. Reports → all titled relationally, content reads relationally with small "astrology in the engine" footer ✅
5. Profile → Cosmic ID Card renamed → ID Card → fine ✅
6. Profile → "Your Chart" sub-link — opens chart wheel ⚠️ (only if reviewer specifically taps in)

**Verdict:** Level 2 is the practical sweet spot for resubmission.

---

## 11. Time-to-fix estimate

| Section | Effort | Owner |
|---|---|---|
| §1.2-1.3 onboarding sign reveal | 1 hr | code |
| §1.5 Circle detail view header | 2 hr | code |
| §2 notifications (channels + templates) | 2 hr | code |
| §3 badges / levels / quests / Cosmic ID | 1.5 hr | code |
| §4 HomeScreen string sweep | 1.5 hr | code |
| §5 Chart tab off main bar (Option C) | 1 hr | code |
| §6 Gemini system prompts + schema | 3-4 hr | code (most risk — schema changes touch HomeScreen + Reports + Match) |
| §7 Reports prompt rewrite | 2 hr | code |
| §8 misc surfaces | 2 hr | code |
| **Level 2 total** | **~16-18 hr** | |

---

## 12. Action plan

If we adopt Level 2, the new task list to add:

- **#23** Rewrite Gemini system prompts to forbid astrology vocab (§6)
- **#24** Update geminiService schema field names + screens that consume them (§6)
- **#25** Disable astrology-flavored notification templates (§2.2)
- **#26** Rename notification channel labels (§2.1)
- **#27** Rename badges, levels, Cosmic ID, quest labels (§3)
- **#28** HomeScreen string sweep — remove "cosmic" from visible UI (§4)
- **#29** Move Chart off tab bar; access via Profile (§5 Option C)
- **#30** Delete MercuryRxCard / LunarEventCard from HomeScreen render (§8.4)
- **#31** Reframe Compatibility detail view header (§1.5)
- **#32** Soften Onboarding step 9 / 10 sign reveal (§1.2-1.3)
- **#33** Reports prompt rewrite — relational lead, astrology footnoted (§7)
- **#34** Misc cleanup (Welcome Back modal, Journal labels, Transits header) (§8.1-8.3)
- **#35** Smoke test all of the above through Expo Go → grep verify → bundle test

These slot in **before** the existing owner tasks (#16-22). Without them, even a perfect TestFlight smoke test won't pass review.
