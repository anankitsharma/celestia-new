# Tight-Bound Narrative — Full Implementation Document

## Task
Transform each tab into a narrative story chapter by enriching AI prompts with continuity context, adding narrative UI elements, and binding screens together through a shared cosmic storyline.

---

## FOUNDATION: narrativeService.js

### New file: `src/services/narrativeService.js`

```js
import { ForecastRepository } from './database/rep_forecasts';
import { JournalRepository } from './database/rep_journal';
import { getCosmicSeason, getActiveCosmicWindows, getMoonDataForDate,
         isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance
} from './astrologyService';
import { getCosmicArchetype } from './cosmicIdentityService';

export async function getNarrativeContext(profileId, chart) {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // Yesterday's data
  const yesterdayJournal = await JournalRepository.getEntry(profileId, yesterdayStr).catch(() => null);
  const yesterdayForecastKey = `${profileId}_today_${yesterdayStr}`;
  const yesterdayForecast = await ForecastRepository.getForecast(yesterdayForecastKey).catch(() => null);

  // Today's cosmic context
  const moonData = getMoonDataForDate(today);
  const cosmicSeason = getCosmicSeason(chart, today);
  const cosmicChange = getCosmicChangeToday(chart);
  const cosmicWindows = getActiveCosmicWindows(chart, today).slice(0, 3);
  const significance = calculateTransitSignificance(chart, today);
  const mercuryRx = isMercuryRetrograde(today);
  const archetype = getCosmicArchetype(chart);

  return {
    yesterday: {
      forecastHeader: yesterdayForecast?.content?.header || null,
      forecastMantra: yesterdayForecast?.content?.mantra || null,
      journalText: yesterdayJournal?.content ?
        JSON.parse(yesterdayJournal.content)?.text?.substring(0, 100) : null,
      journalMood: yesterdayJournal?.content ?
        JSON.parse(yesterdayJournal.content)?.mood : null,
      moonSign: getMoonDataForDate(yesterday)?.sign || null,
    },
    today: { moonData, cosmicChange, significance, cosmicWindows },
    season: cosmicSeason, // { planet, natalTarget, description, progress, daysRemaining, isRetrograde }
    archetype, // { name, tagline, rarity }
    mercuryRx,
  };
}

export function buildNarrativePromptBlock(ctx) {
  if (!ctx) return '';
  const lines = ['NARRATIVE CONTEXT (Weave naturally — never list these as bullet points):'];
  if (ctx.yesterday?.forecastHeader)
    lines.push(`- Yesterday's reading was: "${ctx.yesterday.forecastHeader}"`);
  if (ctx.yesterday?.journalText)
    lines.push(`- User journaled yesterday: "${ctx.yesterday.journalText}" (mood: ${ctx.yesterday.journalMood || 'unspecified'})`);
  if (ctx.season)
    lines.push(`- Cosmic Season: ${ctx.season.planet} is transiting their natal ${ctx.season.natalTarget} — ${ctx.season.progress}% through, ${ctx.season.daysRemaining} days remaining. ${ctx.season.isRetrograde ? 'Currently retrograde — revisiting themes.' : ''}`);
  if (ctx.archetype)
    lines.push(`- Their cosmic archetype: "${ctx.archetype.name}" (${ctx.archetype.rarity})`);
  if (ctx.mercuryRx)
    lines.push('- Mercury is currently retrograde');
  return lines.join('\n');
}
```

### Addition to `rep_forecasts.js`:
```js
async getRecentForecasts(profileId, limit = 3) {
  const db = await getDb();
  return await db.getAllAsync(
    'SELECT * FROM forecasts WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?',
    [profileId, limit]
  );
}
```

---

## TAB 1: TODAY (HomeScreen)

### User Flow Story

> **Morning, 8:15am. Sarah opens Celestia.**
>
> The hero header greets her: "GOOD MORNING · Your fire is showing" with her 14-day streak flame.
>
> Below the period tabs, she sees something new — a subtle warm card:
>
> ```
> PREVIOUSLY
> "Moon in Taurus" — you wrote about feeling grounded (mood: good)
> ```
>
> She smiles — the app remembers yesterday. She scrolls to today's forecast:
>
> *"Yesterday's grounding Taurus energy served you well. Today, as the Moon shifts into Gemini, that stillness transforms into curiosity. You're in the middle of your Saturn-Moon season (day 142 of 320) — this is the chapter where emotional maturity becomes your superpower..."*
>
> The forecast doesn't feel generic. It feels like page 2 of a story she's living.
>
> She glances at the energy grid. Instead of just "Love: 78%", she sees "Love: 78% · Venus speaks". Each score has a tiny planetary attribution.
>
> Scrolling past Cosmic Windows and her journal, she reaches the end section. Where she used to see "DAILY QUESTS", she now sees "TODAY THE COSMOS ASKS" — three story objectives, not a task list.
>
> The last card before extras is the Tomorrow Preview, positioned as a cliffhanger:
>
> *"TOMORROW: Full Moon in Scorpio · Emotions peak. We'll have a ritual ready."*
>
> She closes the app feeling like she just finished a chapter — with just enough anticipation to return tomorrow.

### UI Mockup — "Previously On" Card

```
┌─────────────────────────────────────────┐
│  PREVIOUSLY                             │
│                                         │
│  "Moon in Taurus" — you wrote about     │
│  feeling grounded (mood: good)          │
│                                         │
└─────────────────────────────────────────┘
```

Style:
- Background: `T.warm` (#F3EDE2)
- Border: none, `borderRadius: 14`
- Margin: `{ marginHorizontal: 20, marginBottom: 12 }`
- "PREVIOUSLY" label: `FONTS.sansSemiBold`, 9px, letterSpacing: 2, color: `T.stone`
- Content: `FONTS.serifItalic`, 14px, color: `T.ink`
- Only shows when `activeTab === 'today'` AND yesterday data exists

### UI Mockup — Energy Grid with Attribution

```
Before:                    After:
┌──────┐                  ┌──────┐
│  78  │                  │  78  │
│ LOVE │                  │ LOVE │
│      │                  │Venus │
└──────┘                  └──────┘
```

- Add line below tag: `<Text style={styles.cwAttribution}>{e.attribution}</Text>`
- New style: `cwAttribution: { fontSize: 8, color: T.stone, fontFamily: FONTS.sansRegular }`
- Attribution map: `{ Love: 'Venus', Career: 'Saturn', Health: 'Mars', Mood: 'Moon', Social: 'Jupiter', Creativity: 'Neptune', Focus: 'Mercury', Luck: 'Jupiter' }`

### UI Mockup — Quest Reframe

```
Before:                    After:
┌─────────────────┐       ┌─────────────────────────┐
│ DAILY QUESTS    │       │ TODAY THE COSMOS ASKS    │
│ ☐ Read forecast │       │ ☐ Read your full chapter │
│ ☐ Write journal │       │ ☐ Reflect in journal     │
│ ☐ Check sky     │       │ ☐ Watch the sky          │
└─────────────────┘       └─────────────────────────┘
```

### Full Prompt Text — fetchExtendedForecast (modified)

Add after the existing `CURRENT TRANSITS` section in the prompt (geminiService.js ~line 1180):

```
${narrativeContext ? `
${buildNarrativePromptBlock(narrativeContext)}

STORY INSTRUCTION: This reading is a chapter in an ongoing story, not a standalone horoscope.
- OPENING: Begin with 1 sentence acknowledging yesterday ("Yesterday's [energy/theme] has passed..." or "Building on yesterday's [theme]..."). Never ignore the previous chapter.
- COSMIC SEASON: Naturally reference the user's active cosmic season at least once. This is the overarching plot of their life right now.
- JOURNAL ECHO: If they journaled, reflect their words back with cosmic context ("You felt [X] — that's [planet] working through your [house]").
- FORWARD HOOK: End the guidance paragraph with a subtle hint about what's building ("...and as [planet] approaches [aspect], this energy deepens by [day]").
- ARCHETYPE: Occasionally address them through their archetype lens ("As a [archetype name], you naturally...")
` : ''}
```

---

## TAB 2: ASK AI (ChatScreen)

### User Flow Story

> **Evening, 9pm. Sarah taps "Ask AI" after a difficult day.**
>
> Instead of a generic greeting, the AI says:
>
> *"I see you're deep in your Saturn-Moon season — day 142 of 320. Emotional maturity is the theme. Today's forecast mentioned communication tension from Mercury in Aquarius. You journaled about feeling grounded yesterday but today's Gemini Moon may have stirred things up. What's on your mind tonight?"*
>
> Sarah types: "I had a fight with my partner today."
>
> The AI responds not with generic advice, but with chart-specific insight:
>
> *"Your Mars in Cancer in the 4th house means conflicts feel deeply personal — they hit home. With Mercury currently opposing your natal Venus, words may have landed harder than intended. This transit separates in 2 days. The tension is temporary, but the lesson it's teaching — about expressing needs without defensiveness — that's your Saturn-Moon season at work..."*
>
> The AI connects the fight to her transits, her chart, and her cosmic season. It feels like talking to someone who knows her story.

### Full System Prompt Addition — createChatSession

Add after existing `CRITICAL RULES` section (geminiService.js ~line 1430):

```
=== THE USER'S ONGOING COSMIC STORY ===
${narrativeContext?.season ? `
COSMIC SEASON: ${narrativeContext.season.planet} is transiting their natal ${narrativeContext.season.natalTarget}.
Progress: ${narrativeContext.season.progress}% through (${narrativeContext.season.daysRemaining} days remaining).
Theme: ${narrativeContext.season.description}
${narrativeContext.season.isRetrograde ? 'Currently retrograde — they are revisiting earlier themes from this transit.' : ''}
` : ''}
${narrativeContext?.today ? `
TODAY'S COSMIC WEATHER:
- Moon: ${narrativeContext.today.moonData?.sign || 'unknown'} (${narrativeContext.today.moonData?.phaseName || ''})
- Transit Significance: ${narrativeContext.today.significance}/100 ${narrativeContext.today.significance >= 70 ? '(COSMIC DOWNLOAD DAY — major activations)' : ''}
- Active Cosmic Windows: ${narrativeContext.today.cosmicWindows?.map(w => w.description).join('; ') || 'none'}
${narrativeContext.mercuryRx ? '- Mercury is RETROGRADE — communication, tech, and revisiting past themes' : ''}
` : ''}
${narrativeContext?.yesterday?.journalText ? `
RECENT JOURNAL: On ${new Date(Date.now()-86400000).toLocaleDateString()}, user wrote: "${narrativeContext.yesterday.journalText}" (mood: ${narrativeContext.yesterday.journalMood || 'unspecified'})
` : ''}
${narrativeContext?.yesterday?.forecastHeader ? `
YESTERDAY'S FORECAST: "${narrativeContext.yesterday.forecastHeader}"
` : ''}

STORY-AWARE GUIDANCE:
- You are this user's cosmic mentor who has been following their journey
- Reference their cosmic season naturally when relevant (this is the BIG theme of their life right now)
- If they mention something their journal touched on, acknowledge the connection
- Connect their questions to active transits when it deepens understanding
- Never list this context back to them — weave it naturally into conversation
- You are warm, wise, and specific. Generic advice is your enemy.
```

### Narrative-Aware Greeting Builder

In ChatScreen.js, replace the initial greeting logic:

```js
const buildNarrativeGreeting = (ctx) => {
  if (!ctx) return "What's on your mind today?";

  const parts = [];
  if (ctx.season) {
    parts.push(`You're ${ctx.season.progress}% through your ${ctx.season.planet}-${ctx.season.natalTarget} season — ${ctx.season.description?.toLowerCase()}.`);
  }
  if (ctx.mercuryRx) {
    parts.push("Mercury is retrograde, so communication needs extra awareness.");
  }
  if (ctx.yesterday?.journalMood) {
    const moodMap = { great: 'wonderful', good: 'good', okay: 'okay', low: 'heavy', anxious: 'anxious' };
    parts.push(`You felt ${moodMap[ctx.yesterday.journalMood] || ctx.yesterday.journalMood} yesterday.`);
  }
  if (ctx.today?.moonData?.sign) {
    parts.push(`The Moon is in ${ctx.today.moonData.sign} today.`);
  }
  parts.push("What would you like to explore?");
  return parts.join(' ');
};
```

---

## TAB 3: CHART (ChartScreen)

### User Flow Story

> **Sarah taps the Chart tab to explore her birth chart.**
>
> Her chart wheel renders as usual, but something new catches her eye — next to her natal Moon (Cancer, 4th house), there's a small pulsing gold dot with "LIVE" text.
>
> She taps it. The deep dive modal opens with its usual hook/strength/challenge/advice, but now includes a new section at the top:
>
> *"RIGHT NOW: Saturn at 22° Pisces is forming a sextile to your natal Moon. This transit is day 142 of ~320. Everything you're feeling emotionally is being asked to mature. The deep dive below is your Moon's permanent pattern — but Saturn is adding a temporary layer of gravity."*
>
> She scrolls down through the deep dive. At the bottom, instead of just her Moon's general meaning, the advice now says:
>
> *"Your Moon in Cancer craves safety. With Saturn currently touching this placement, you're learning that true safety comes from within, not from others. This lesson has 178 days left to integrate."*
>
> She exits and notices her locked planets. Venus (unlocking tomorrow) no longer just says "Day 1 — Tap to reveal." It says:
>
> *"Day 1 — Your love language is about to be revealed"*

### UI Mockup — Transit Activation Badge

```
Planet Row (currently activated by transit):

┌───────────────────────────────────────────┐
│  ☽  Moon        Cancer  14°   4th house   │
│                              ● LIVE       │
└───────────────────────────────────────────┘

Planet Row (not activated):

┌───────────────────────────────────────────┐
│  ☉  Sun         Aries   20°   1st house   │
└───────────────────────────────────────────┘
```

- Gold pulsing dot: `width: 6, height: 6, borderRadius: 3, backgroundColor: T.gold`, animated opacity 0.4→1.0
- "LIVE" text: `fontSize: 7, fontFamily: FONTS.sansBold, color: T.gold, letterSpacing: 1`
- Check: compare each natal planet against `getActiveCosmicWindows()` results

### Deep Dive Transit Context — Prompt Addition

Add to `generatePlacementDeepDive` prompt in geminiService.js:

```
${transitContext ? `
CURRENT TRANSIT ACTIVATION:
${transitContext}
Include a "RIGHT NOW" opening paragraph (2-3 sentences) about how this transit is temporarily modifying this natal placement. What is the transit asking of this placement? How long will this activation last? Then continue with the permanent natal interpretation below.
` : ''}
```

### Drip-Feed Narrative Labels

Map in `unlockService.js` or inline in ChartScreen:

```js
const UNLOCK_NARRATIVES = {
  'Venus': 'Your love language is about to be revealed',
  'Mars': 'Discover what fuels your ambition and desire',
  'Mercury': 'How your mind truly works — revealed',
  'Jupiter': 'Where fortune and expansion find you',
  'Saturn': 'The lesson you came here to learn',
  'North Node': 'Your soul\'s direction — the path forward',
  'Midheaven': 'Your calling and public legacy — revealed',
  'Neptune': 'What you dream about when no one is watching',
  'Uranus': 'Where you break every rule',
  'Pluto': 'Your deepest transformation — handle with power',
  'Chiron': 'The wound that becomes your greatest gift',
};
```

---

## TAB 4: MATCH (CompatibilityScreen)

### User Flow Story

> **Sarah checks her compatibility with her partner Alex.**
>
> The score ring shows 78% as usual. But below the score bars, a new section appears:
>
> ```
> WHAT'S ACTIVE BETWEEN YOU
> ♀ Venus is crossing Alex's Ascendant — attraction
>   energy heightened this week
> ♄ Your Saturn-Moon season is coloring emotional
>   dynamics — patience is being tested
> ```
>
> The AI analysis now weaves in timing: *"This week, with Venus activating Alex's rising sign, there's a window for deeper connection. But your Saturn-Moon season asks for emotional honesty — don't settle for surface-level peace. The real growth happens when you both say what's hard to say."*
>
> At the bottom, a subtle future hook: *"Next week: Mars enters your 7th house. Passion rises but so can conflict. Use this week's Venus energy to build the foundation."*

### UI Mockup — "What's Active" Section

```
┌─────────────────────────────────────────┐
│  WHAT'S ACTIVE BETWEEN YOU              │
│                                         │
│  ♀ Venus crossing Alex's Ascendant —    │
│    attraction energy heightened          │
│                                         │
│  ♄ Your Saturn-Moon season coloring     │
│    emotional dynamics this month         │
│                                         │
└─────────────────────────────────────────┘
```

Position: after score bars, before AI analysis section
Style: `T.warm` background, `borderRadius: 14`, `padding: 16`
Data: filter `getActiveCosmicWindows()` for both charts, looking for hits on Venus, Moon, 7th house cusp, Descendant

### Match Prompt Addition

Add to `generateMatchCore` and `generateMatchDetails` in geminiService.js:

```
${transitContext ? `
CURRENT COSMIC WEATHER AFFECTING THIS RELATIONSHIP:
${transitContext}

Weave 2-3 sentences about how RIGHT NOW is a specific moment for this relationship. What current transits are activating the connection? What should they pay attention to this week? Don't just describe — advise. End with a 1-sentence forward hook about what's coming in the next 2 weeks.
` : ''}
```

Build `transitContext` in CompatibilityScreen by checking both charts:
```js
const userWindows = getActiveCosmicWindows(userProfile.chart, new Date());
const partnerWindows = getActiveCosmicWindows(partnerProfile.chart, new Date());
const relationshipPlanets = ['Venus', 'Moon', 'Mars'];
const relevantWindows = [...userWindows, ...partnerWindows]
  .filter(w => relationshipPlanets.includes(w.planet) || relationshipPlanets.includes(w.natalPlanet));
const transitContext = relevantWindows.map(w => `${w.description} (${w.significance})`).join('; ');
```

---

## TAB 5: SKY (TransitsScreen)

### User Flow Story

> **Sarah taps the Sky tab to see what's happening overhead.**
>
> The transit list shows her active aspects. But now each card has a timing line:
>
> *"Mars square natal Mercury — Building (peaks March 15)"*
> *"Venus trine natal Jupiter — Exact today"*
> *"Saturn sextile natal Moon — Day 142 of ~320"*
>
> At the bottom of the list, a foreshadowing card:
>
> ```
> BUILDING TOWARD
> ♂ Mars conjunct your natal Venus — arriving March 22
> Passion and desire intensify. A significant week for love.
> ```
>
> She taps a transit card to expand it. The AI insight now includes timing: *"This Mars-Mercury tension is at its peak. Communication friction is strongest today and tomorrow. By March 17, the energy releases. Use this tension productively — say what needs to be said, then let it go."*

### UI Mockup — Transit Card with Timing

```
Before:                              After:
┌────────────────────────────┐      ┌────────────────────────────┐
│ ♂ Mars □ Mercury           │      │ ♂ Mars □ Mercury           │
│ orb: 1.2° ●●●○             │      │ orb: 1.2° ●●●○             │
│                            │      │ Building · peaks Mar 15     │
└────────────────────────────┘      └────────────────────────────┘
```

- Timing line: `fontSize: 10, color: T.stone, fontFamily: FONTS.sansRegular`
- Derive from orb direction: if orb is decreasing day-over-day → "Building", if at minimum → "Exact", if increasing → "Separating"

### UI Mockup — "Building Toward" Card

```
┌─────────────────────────────────────────┐
│  ★ BUILDING TOWARD                      │
│                                         │
│  ♂ Mars conjunct your natal Venus       │
│  Arriving ~March 22                     │
│                                         │
│  Passion and desire intensify.          │
│  A significant week for love.           │
└─────────────────────────────────────────┘
```

Position: after transit list, before any promo
Data: check `getActiveCosmicWindows(chart, futureDate)` for dates +1 through +14, find first significant window not currently active

### Transit Insight Prompt Addition

Add to `generateTransitInsight` in geminiService.js:

```
TIMING CONTEXT: Include 1 sentence about where this transit is in its arc. Is it building toward exact (anticipation), exact right now (peak intensity), or separating (integrating lessons)? Give approximate dates if possible. The user should feel they know WHERE they are in this transit's story — beginning, middle, or end.
```

---

## TAB 6: REPORTS (ReportsScreen)

### User Flow Story

> **Sarah opens Reports and sees the Love Report card.**
>
> The description has changed from the static "Explore the cosmic patterns shaping your love life" to:
>
> *"Venus is activating your 7th house this week — perfect timing for a love deep-dive"*
>
> She generates the report. The opening paragraph says:
>
> *"This Love Report arrives at a significant moment. You're 142 days into a Saturn-Moon transit that is reshaping your emotional foundations. Venus is currently in your partnership sector. What you read here isn't abstract — it's speaking directly to the transformation you're living right now."*
>
> The report's closing recommends specific timing:
>
> *"The best window for a vulnerable conversation with your partner is March 20-23, when Venus trines your natal Jupiter. Don't wait — this energy is rare."*

### Report Card Dynamic Descriptions

In ReportsScreen, replace static descriptions with context-aware ones:

```js
const getReportDescription = (type, narrativeCtx) => {
  const defaults = {
    love: 'Explore the cosmic patterns shaping your love life',
    career: 'Unlock your professional potential through your chart',
    // ...existing defaults
  };
  if (!narrativeCtx) return defaults[type];

  // Check if cosmic season or windows are relevant
  const loveWindows = narrativeCtx.today.cosmicWindows?.filter(w =>
    ['Venus', 'Moon'].includes(w.planet) || ['Venus', 'Moon'].includes(w.natalPlanet));
  const careerWindows = narrativeCtx.today.cosmicWindows?.filter(w =>
    ['Saturn', 'Jupiter', 'Mars'].includes(w.planet));

  if (type === 'love' && loveWindows?.length > 0)
    return `${loveWindows[0].planet} is active in your chart — perfect timing for a love deep-dive`;
  if (type === 'career' && narrativeCtx.season?.planet === 'Saturn')
    return `Saturn is reshaping your ambitions — this report guides you through`;
  return defaults[type];
};
```

### Report Prompt Addition

Add to `generateFullReport` and `generateDeepPdfReport` in geminiService.js:

```
${narrativeContext ? `
CURRENT COSMIC MOMENT (weave into opening and closing — make this report feel TIMELY):
${buildNarrativePromptBlock(narrativeContext)}

This report should NOT feel like a generic document. Open by acknowledging why NOW is a meaningful time to explore this topic. Close with specific timing recommendations based on upcoming transits. The reader should feel this report was written FOR this exact moment in their cosmic journey.
` : ''}
```

---

## CROSS-CUTTING: Profile & Notifications

### Profile — Journey Narrative Framing

```
Before:                              After:
┌────────────────────────────┐      ┌────────────────────────────┐
│ ENGAGEMENT                 │      │ YOUR COSMIC JOURNEY        │
│                            │      │                            │
│ 🔥 14 day streak           │      │ 🔥 14 day streak            │
│                            │      │ Your devotion to the       │
│ Level 3: Nebula            │      │ cosmic practice            │
│ ████████░░ 450/1000 XP     │      │                            │
│                            │      │ Chapter 3: Nebula          │
│ NEXT ACHIEVEMENT           │      │ ████████░░ 450/1000 XP     │
│ Deep Diver 3/5             │      │                            │
│                            │      │ YOUR NEXT CHAPTER          │
│                            │      │ Deep Diver — 2 dives to go │
└────────────────────────────┘      └────────────────────────────┘
```

### Notifications — Yesterday-Aware Templates

Add to `notificationContentEngine.js` COSMIC_MORNING templates:

```js
{
  id: 'cm_yesterday_thread',
  requires: ['yesterdayForecast'],
  weight: (d) => d.yesterdayForecast?.header ? 6 : 0,
  generate: (d) => ({
    title: 'Your story continues',
    body: `Yesterday: "${d.yesterdayForecast.header}". Today the energy shifts — your next chapter is ready.`
  })
},
{
  id: 'cm_journal_follow',
  requires: ['yesterdayJournal'],
  weight: (d) => d.yesterdayJournal?.mood ? 5 : 0,
  generate: (d) => ({
    title: `Good morning, ${d.userName}`,
    body: `You felt ${d.yesterdayJournal.mood} yesterday. The Moon moved to ${d.moonData?.sign || 'a new sign'} overnight — see what today brings.`
  })
}
```

Update `buildNotificationData` to include `yesterdayForecast` and `yesterdayJournal` fields.

---

## IMPLEMENTATION PRIORITY

### Layer 1: AI Prompt Changes (Week 1)
1. Create `narrativeService.js` + add `getRecentForecasts()` to rep_forecasts
2. Enrich `fetchExtendedForecast` prompt (HomeScreen daily reading becomes narrative)
3. Enrich `createChatSession` system prompt (Chat becomes story-aware)
4. These 3 changes alone transform the two most-used features

### Layer 2: UI Narrative Elements (Week 2)
5. "Previously On" card on HomeScreen
6. Energy grid attribution labels
7. Quest/badge text reframing
8. Transit activation badges on ChartScreen
9. Drip-feed narrative labels

### Layer 3: Cross-Screen Binding (Week 3)
10. "What's Active" section on CompatibilityScreen
11. Transit timing context on TransitsScreen
12. "Building Toward" foreshadowing card
13. Report prompt enrichment + dynamic descriptions
14. Notification thread templates
15. Profile journey framing

---

## FILES MODIFIED

| File | What Changes |
|------|-------------|
| **NEW** `src/services/narrativeService.js` | Central narrative context assembly |
| `src/services/database/rep_forecasts.js` | Add `getRecentForecasts()` |
| `src/services/geminiService.js` | Prompt enrichment: fetchExtendedForecast, createChatSession, generateMatchCore, generateMatchDetails, generatePlacementDeepDive, generateTransitInsight, generateFullReport, generateDeepPdfReport, generateMonthlyRecap |
| `src/screens/HomeScreen.js` | Previously On card, energy attributions, load narrative context |
| `src/screens/ChatScreen.js` | Load narrative context, narrative greeting builder |
| `src/screens/ChartScreen.js` | Transit activation badges, transit context in deep dives |
| `src/screens/CompatibilityScreen.js` | "What's Active" section, transit context in prompts |
| `src/screens/TransitsScreen.js` | Timing labels, "Building Toward" card |
| `src/screens/ReportsScreen.js` | Dynamic descriptions, narrative context in prompts |
| `src/screens/ProfileScreen.js` | Journey framing text changes |
| `src/components/QuestCard.js` | Header + label text reframing |
| `src/services/notificationContentEngine.js` | 2 new yesterday-aware templates |
| `src/services/unlockService.js` | Narrative labels per planet |

---

## VERIFICATION

- `node -c` passes on all files
- Today tab: "Previously On" shows yesterday's header + journal mood
- Forecast opening paragraph references yesterday, cosmic season, and journal
- Chat greets with cosmic season awareness and journal reference
- Chart: activated planets show "LIVE" badge
- Match: "What's Active" section shows relationship-relevant transits
- Sky: transit cards show timing (Building/Exact/Separating)
- Reports: card descriptions change based on current transits
- Morning notification references yesterday's thread
