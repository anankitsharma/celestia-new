# Compatibility Cards: Consolidation & Detail Enhancement Plan

> A comprehensive plan to merge redundant cards, deepen the content inside each card, and ensure the card deck feels curated rather than cluttered.

---

## Current State: Card Inventory Per Role

| # | Card Key | Partner | Friend | Parent | Sibling | Boss | Colleague | Child | Other |
|---|---|---|---|---|---|---|---|---|---|
| 0 | **cover** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1 | aiAnalysis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | dimensions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | loveLanguages | ✅ | — | — | — | — | — | — | — |
| 4 | friendshipDynamic | — | ✅ | — | — | — | — | — | — |
| 5 | adventureCompat | — | ✅ | — | — | — | — | — | — |
| 6 | siblingDynamic | — | — | — | ✅ | — | — | — | — |
| 7 | generationalPattern | — | — | ✅ | — | — | — | — | — |
| 8 | communicationGuide | — | — | ✅ | — | — | — | — | — |
| 9 | communicationPlaybook | — | — | — | — | ✅ | — | — | — |
| 10 | careerStrategy | — | — | — | — | ✅ | — | — | — |
| 11 | teamworkProfile | — | — | — | — | — | ✅ | — | — |
| 12 | parentingGuide | — | — | — | — | — | — | ✅ | — |
| 13 | childNature | — | — | — | — | — | — | ✅ | — |
| 14 | healingPath | — | — | ✅ | — | — | — | — | — |
| 15 | conflictStyle | ✅ | — | — | — | — | — | — | — |
| 16 | areas (Deep Dive) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 17 | sharedValues | ✅ | ✅ | — | ✅ | — | ✅ | — | ✅ |
| 18 | keyConnections | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 19 | relationshipSeason | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 20 | activeWindows | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 21 | actionRow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Problem:** Partner has **12+ swipe cards**. That's too many. The user gets deck fatigue before reaching the powerful live transit cards at the end.

---

## Proposed Merges

### Merge 1: `aiAnalysis` → INTO `cover` card modal

**Why:** The AI analysis is the "first impression" content — the archetype, snapshot, and hook line. We already show the archetype in the cover card modal. The full AI analysis text should live there too, not as a separate card.

**Result:** The cover card's pageSheet becomes **"The Connection Overview"** — score breakdown + archetype + full AI narrative + top synastry links.

### Merge 2: `dimensions` → INTO `areas` (Deep Dive)

**Why:** Both are about the same thing — dimension scores. `dimensions` shows bar charts of the 4 score categories. `areas` shows the same categories expanded with strengths/tensions/analysis. Having both is redundant; the bar chart should be a header inside the Deep Dive card.

**Result:** The Deep Dive card opens with dimension bars at the top, then flows into the full analysis per area.

### Merge 3: `relationshipSeason` + `activeWindows` → **"Cosmic Timing"**

**Why:** Both are "live" time-based insights. Separately they feel thin — season is one badge + one description, windows is a list. Together they form one compelling "what's happening RIGHT NOW" card.

**Result:** A single **"Cosmic Timing"** card showing the season badge → progress bar → season directive → active transit windows.

### Merge 4 (Friend only): `friendshipDynamic` + `adventureCompat` → **"Your Friendship"**

**Why:** Both are small and directly related. The "vibe" description, best activity, ideal trip, and shared energy are one story.

**Result:** Single **"Your Friendship"** card with vibe description, best activity, ideal trip, and shared energy all in one pageSheet.

### Merge 5 (Child only): `parentingGuide` + `childNature` → **"Your Child"**

**Why:** Both are about understanding the child. Having two thin cards about the same child feels repetitive.

**Result:** Single **"Your Child"** card with core temperament → emotional needs → your parenting strengths → growth edges.

### Merge 6 (Boss only): `communicationPlaybook` + `careerStrategy` → **"Your Playbook"**

**Why:** Both are tactical advice for the same person. Communication tactics and career strategy are two faces of the same coin.

**Result:** Single **"Your Playbook"** card with communication style → best approach → leverage points → timing insights.

---

## Post-Merge Card Deck Per Role

### Partner (was 12 → now 7)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score arc + names + verdict + hookLine | Full AI narrative + archetype + dimension bars + top 3 synastry links + Ask Celestia CTA |
| 1 | **Love Languages** | Both partners' needs side-by-side | User's love language + partner's love language + how they harmonize + "Words of Affirmation" / "Quality Time" chips |
| 2 | **Deep Dive** | Top area score + "4 dimensions mapped" | Dimension bars header → then each area card with Strength → Friction → Analysis → Reflection → Weekly Action |
| 3 | **Conflict Style** | `patternName` + trigger snippet | The Trigger → The Resolution → Pattern Name badge + "How to fight fair" action card |
| 4 | **Shared Values** | `sharedValuesTheme` + value chips | Theme highlight → value pill chips → growth tensions side-by-side → Share CTA |
| 5 | **Key Links** | Top 2 aspect cards | Full synastry aspect list with harmonic (green) vs tense (red) coloring |
| 6 | **Cosmic Timing** | Season name + "N windows active" | Season badge → progress bar → season directive → all active transit windows with peak flags |
| 7 | **Actions** | "Chat · PDF · Share · Invite" | Ask Celestia CTA + Download PDF + Share + Add partner |

### Friend (was 11 → now 6)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + names + hookLine | AI narrative + dimension bars + top links |
| 1 | **Your Friendship** | Vibe description + best activity chip | Vibe → best activity → ideal trip card → shared energy → "Past Moment" nostalgia quote |
| 2 | **Deep Dive** | Top area + "4 dimensions" | Bars header → area cards with weekly actions |
| 3 | **Shared Values** | Theme + value chips | Theme → chips → tensions → share CTA |
| 4 | **Key Links** | Top 2 aspects | Full aspect list |
| 5 | **Cosmic Timing** | Season + windows count | Season + transits |
| 6 | **Actions** | CTAs | Chat + PDF + Share |

### Parent (was 10 → now 6)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + names + hookLine | AI narrative + bars + links |
| 1 | **Generational Pattern** | Pattern name + origin | Pattern → Origin → Cycle Breaker → Healing step |
| 2 | **Communication Guide** | Bridge tip snippet | Their style vs your style → bridge tip → "Avoid" phrase |
| 3 | **Deep Dive** | Top area + dimensions | Bars → area cards |
| 4 | **Healing Path** | Affirmation quote | Wound → Approach → Affirmation |
| 5 | **Cosmic Timing** | Season + windows | Season + transits |
| 6 | **Actions** | CTAs | Chat + PDF + Share |

### Sibling (was 9 → now 5)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + dynamic label | AI narrative + bars + links |
| 1 | **Sibling Dynamic** | Alliance vs Rivalry bars | Alliance/Rivalry % → Who's Boss → Insight |
| 2 | **Deep Dive** | Top area | Bars → area cards |
| 3 | **Shared Values** | Theme + chips | Theme → chips → tensions |
| 4 | **Cosmic Timing** | Season + windows | Season + transits |
| 5 | **Actions** | CTAs | Chat + PDF |

### Boss (was 9 → now 5)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + hookLine | AI narrative + bars + links |
| 1 | **Your Playbook** | Best approach snippet | Communication style → Best approach → Avoid → Leverage → Timing → Growth tip |
| 2 | **Deep Dive** | Top area | Bars → area cards |
| 3 | **Key Links** | Top 2 aspects | Full aspect list |
| 4 | **Cosmic Timing** | Season + windows | Season + transits |
| 5 | **Actions** | CTAs | Chat + PDF |

### Colleague (was 9 → now 5)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + hookLine | AI narrative + bars + links |
| 1 | **Teamwork Profile** | Best collab style | Your role → Their role → Collab style → Watch for |
| 2 | **Deep Dive** | Top area | Bars → area cards |
| 3 | **Shared Values** | Theme + chips | Theme → chips → tensions |
| 4 | **Cosmic Timing** | Season + windows | Season + transits |
| 5 | **Actions** | CTAs | Chat + PDF |

### Child (was 9 → now 5)

| # | Card | Face Preview | Modal Content |
|---|---|---|---|
| 0 | **Cover** | Score + hookLine | AI narrative + bars + links |
| 1 | **Your Child** | Core temperament | Temperament → emotional need → best motivator → your strength → growth edge |
| 2 | **Deep Dive** | Top area | Bars → area cards |
| 3 | **Key Links** | Top 2 aspects | Full aspect list |
| 4 | **Cosmic Timing** | Season + windows | Season + transits |
| 5 | **Actions** | CTAs | Chat + PDF |

---

## Detailed Content Inside Each Card's Modal

### Cover Card Modal (all roles)

| Section | Content | Source |
|---|---|---|
| 1. Archetype Badge | `matchCore.relationshipArchetype` (e.g. "Cosmic Mirrors") | geminiService: matchCoreSchema |
| 2. AI Narrative | Full `aiAnalysis` text (the multi-paragraph reading) | geminiService: generateMatchInsights → `integration` or generateMatchDetails AI analysis |
| 3. Viral Verdict | `matchCore.viralVerdict` in a gold pill badge | geminiService: matchCoreSchema |
| 4. Dimension Bars | `roleDims[]` rendered as labeled bars with percentages | astrologyService: synastry scores |
| 5. Top 3 Synastry Links | First 3 from `synastry.links[]` as colored cards (green=harmonic, red=tense) | astrologyService: synastry links |
| 6. AI Hook Quote | `matchCore.hookLine` in an italic quote block | geminiService: matchCoreSchema |
| 7. Ask Celestia CTA | Button → AskAI screen with pre-filled message | Navigation action |

### Deep Dive Card Modal (all roles)

| Section | Content | Source |
|---|---|---|
| 1. Dimension Bars Header | `roleDims[]` with icons + labels + percentage bars | astrologyService |
| 2. Per-Area Cards | For each area in `matchDetails.areas`: | geminiService: matchDetails |
| — Score Badge | `area.score` in a colored pill | |
| — Strength | Green-tinted block with strength text | |
| — Friction | Red-tinted block with tension text | |
| — Analysis | 2-paragraph editorial analysis | |
| — Reflection | Italic quote — a question to sit with | |
| — Weekly Action | Accent-bordered action chip with verb-first micro-action | |

### Cosmic Timing Card Modal (all roles)

| Section | Content | Source |
|---|---|---|
| 1. Season Badge | `cosmicSeason.season` name in a large badge | astrologyService |
| 2. Season Description | `cosmicSeason.description` full text | astrologyService |
| 3. Progress Bar | Visual bar showing `cosmicSeason.progress`% with end date | astrologyService |
| 4. Season Directive | `cosmicSeason.seasonAction` in an Action Card | astrologyService |
| 5. Active Windows | Each `activeRelationshipWindows[]` item as a card | astrologyService |
| — Transit Name | Planet + aspect description | |
| — PEAK Badge | If window is at peak, show red "PEAK" badge | |
| — Start/End | Date range for the transit window | |

### Love Languages Modal (partner only)

| Section | Content | Source |
|---|---|---|
| 1. User's Language | `matchDetails.loveLanguages.user` with user's name | geminiService |
| 2. Partner's Language | `matchDetails.loveLanguages.partner` with partner name | geminiService |
| 3. How They Match | `matchDetails.loveLanguages.match` — harmonize or friction | geminiService |
| 4. Support Styles | `matchDetails.support.emotional` + `matchDetails.support.practical` | geminiService |

### Conflict Style Modal (partner only)

| Section | Content | Source |
|---|---|---|
| 1. Pattern Name | `matchDetails.conflictStyle.patternName` in a badge | geminiService |
| 2. The Trigger | `matchDetails.conflictStyle.triggers` in a red-tinted block | geminiService |
| 3. The Resolution | `matchDetails.conflictStyle.resolution` in a green-tinted block | geminiService |
| 4. Ask Celestia | CTA → "How do I navigate conflict with [name]?" | Navigation action |

### Friendship Card Modal (friend only)

| Section | Content | Source |
|---|---|---|
| 1. Vibe Description | `friendshipDynamic.vibeDescription` | geminiService |
| 2. Best Activity | `friendshipDynamic.bestActivity` in an accent chip | geminiService |
| 3. Past Moment | `friendshipDynamic.pastMoment` as a nostalgia quote | geminiService |
| 4. Ideal Trip | `adventureCompat.idealTrip` in an Action Card with ✈ icon | geminiService |
| 5. Shared Energy | `adventureCompat.sharedEnergy` badge | geminiService |
| 6. Next Trip | `adventureCompat.nextTrip` as a destination chip | geminiService |
| 7. Best Timing | `adventureCompat.bestTiming` in a timing pill | geminiService |

### Generational Pattern Modal (parent only)

| Section | Content | Source |
|---|---|---|
| 1. The Pattern | `generationalPattern.pattern` | geminiService |
| 2. The Origin | `generationalPattern.origin` in an info block | geminiService |
| 3. The Healing | `generationalPattern.healing` in a green block | geminiService |
| 4. Cycle Breaker | `generationalPattern.cycleBreaker` in an Action Card | geminiService |

### Communication Guide Modal (parent only)

| Section | Content | Source |
|---|---|---|
| 1. Their Style | `communicationGuide.theirStyle` | geminiService |
| 2. Your Style | `communicationGuide.yourStyle` | geminiService |
| 3. Bridge Tip | `communicationGuide.bridgeTip` in a highlight block | geminiService |
| 4. Words to Avoid | `communicationGuide.avoidPhrase` in a red-tinted block | geminiService |

### Healing Path Modal (parent only)

| Section | Content | Source |
|---|---|---|
| 1. The Wound | `healingPath.wound` | geminiService |
| 2. The Approach | `healingPath.approach` | geminiService |
| 3. Affirmation | `healingPath.affirmation` in italic, centered | geminiService |

### Sibling Dynamic Modal (sibling only)

| Section | Content | Source |
|---|---|---|
| 1. Dynamic Label | `siblingDynamic.dynamicLabel` badge | geminiService |
| 2. Alliance vs Rivalry | Two side-by-side bars with percentages | geminiService |
| 3. Who's Boss | `siblingDynamic.whosBoss` humorous callout | geminiService |
| 4. Insight | `siblingDynamic.insight` | geminiService |

### Your Playbook Modal (boss only)

| Section | Content | Source |
|---|---|---|
| 1. Their Style | `communicationPlaybook.theirStyle` | geminiService |
| 2. Best Approach | `communicationPlaybook.bestApproach` highlight block | geminiService |
| 3. What to Avoid | `communicationPlaybook.avoid` red block | geminiService |
| 4. Your Edge | `careerStrategy.leverage` | geminiService |
| 5. Best Timing | `careerStrategy.timing` | geminiService |
| 6. Growth Tip | `careerStrategy.growthTip` Action Card | geminiService |

### Teamwork Profile Modal (colleague only)

| Section | Content | Source |
|---|---|---|
| 1. Your Role | `teamworkProfile.yourRole` | geminiService |
| 2. Their Role | `teamworkProfile.theirRole` | geminiService |
| 3. Best Collab Style | `teamworkProfile.bestCollabStyle` highlight block | geminiService |
| 4. Watch For | `teamworkProfile.watchFor` warning block | geminiService |

### Your Child Modal (child only)

| Section | Content | Source |
|---|---|---|
| 1. Core Temperament | `childNature.coreTemperament` | geminiService |
| 2. Emotional Need | `childNature.emotionalNeed` highlight block | geminiService |
| 3. Best Motivator | `childNature.bestMotivator` action chip | geminiService |
| 4. Your Strength | `parentingGuide.yourStrength` | geminiService |
| 5. Their Needs | `parentingGuide.theirNeeds` | geminiService |
| 6. Growth Edge | `parentingGuide.growthEdge` action card | geminiService |

### Shared Values Modal (partner, friend, sibling, colleague, other)

| Section | Content | Source |
|---|---|---|
| 1. Values Theme | `matchDetails.sharedValuesTheme` editorial sentence | geminiService |
| 2. Value Chips | `matchDetails.sharedValues[]` as pill chips with astrological glyphs | geminiService |
| 3. Growth Tensions | `matchDetails.growthTensions[]` side-by-side cards | geminiService |
| 4. Support Styles | `matchDetails.support.emotional` + `matchDetails.support.practical` | geminiService |
| 5. Share CTA | Button to share compatibility values | Share API |

### Key Links Modal (all roles)

| Section | Content | Source |
|---|---|---|
| 1. Harmonic Aspects | `synastry.links.filter(!isTense)` as green-bordered cards | astrologyService |
| 2. Tense Aspects | `synastry.links.filter(isTense)` as red-bordered cards | astrologyService |
| 3. Each card shows | planet1 + aspect glyph + planet2 + label + description | astrologyService |

---

## Implementation Files to Change

### 1. `roleDetailConfig.js`
- Update `sectionOrder` for every role to reflect the merges
- Remove `aiAnalysis`, `dimensions`, `activeWindows` from all section orders
- Merge `friendshipDynamic` + `adventureCompat` into `friendshipCard`
- Merge `parentingGuide` + `childNature` into `childCard`
- Merge `communicationPlaybook` + `careerStrategy` into `bossPlaybook`
- Replace `relationshipSeason` with `cosmicTiming`

### 2. `CompatibilityScreen.js`
- **Cover card modal**: Already has dimension bars + synastry links. Add `aiAnalysis` text and `viralVerdict` badge.
- **`renderSection`**: Add new merged section handlers (`cosmicTiming`, `friendshipCard`, `childCard`, `bossPlaybook`)
- **Deck card builder**: Update the card list generator to use merged keys
- **Deep Dive card**: Prepend dimension bars header before the per-area cards
- Remove standalone `aiAnalysis` and `dimensions` section renderers (content moves to cover)

### 3. `geminiService.js`
- No schema changes needed — all data fields already exist. We're just reorganizing how they're displayed.

---

## Summary: Before vs After

| Role | Cards Before | Cards After | Reduction |
|---|---|---|---|
| Partner | 12 | 8 | -33% |
| Friend | 11 | 7 | -36% |
| Parent | 10 | 7 | -30% |
| Sibling | 9 | 6 | -33% |
| Boss | 9 | 6 | -33% |
| Colleague | 9 | 6 | -33% |
| Child | 9 | 6 | -33% |
| Other | 9 | 5 | -44% |

**Every card now has rich, complete content in its modal — no thin cards.** The user gets a curated magazine with fewer, denser pages instead of endless thin swipes.
