# 14 — PDF Plan: Remaining Gaps
## What's still missing after the alignment work, ranked by impact

---

## Section-by-section gap analysis

### §01 The strategic situation
✅ Fully reflected. Both windows (Apple + TikTok) acknowledged in plan docs.

### §02 The product positioning
| PDF item | Status |
|---|---|
| App name "Celestia: Relationship Patterns" | ✅ singular for 30-char fit |
| Subtitle "Understand love & connection" | ✅ |
| Primary category Health & Fitness > Mindfulness | ✅ doc'd |
| First 200 chars hook | ✅ |
| Keywords (8 items) | ✅ |
| 7 screenshots spec | 🟡 spec exists, **not yet produced** (manual task #4) |

### §03 The onboarding flow
| PDF screen | Our current | Gap |
|---|---|---|
| 1. "Understand the patterns in your relationships." | "Every relationship has a pattern" | ✅ equivalent |
| 2. "What's something you keep repeating in love?" with 4 specific options | Current step 2 = generic motivation | 🔴 **Reword** to PDF-exact |
| 3. "How would you describe your communication style when triggered?" with 4 options | Current step 3 = "What feels most uncertain right now?" | 🔴 **Replace** with PDF question |
| 4. Framework citation | ✅ added (our step 5) | ✅ |
| 5. DOB + time + location | ✅ (our 6/7/8) | ✅ |
| 6. "Building your personality blueprint..." | ✅ "Building your profile" | ✅ |
| 7. Reveal: attachment + astrology | ✅ added | ✅ |
| 8. "Add a partner / Skip" | Current step 12 = daily hook with three cards | 🟡 **Reframe** as Connections add prompt |

**Gap: 3 onboarding tweaks** — PDF question wording in steps 2 + 3, final step reframe.

### §04 The post-onboarding product
| PDF item | Status |
|---|---|
| Tab structure: Today / Connections / Ask / Profile | ✅ |
| Today: today's theme | ✅ Navigator briefing covers |
| Today: **reflection prompt** | ✅ added |
| Today: **pattern of the week** | 🔴 **NOT BUILT** (needs cross-day analytics) |
| Today: **drift alert** ("You haven't reflected on Marcus in 3 weeks") | 🔴 **NOT BUILT** (needs Connection-touched-at tracking) |
| Today: **quick-add** (10-second add new connection) | 🔴 **NOT BUILT** as a Today affordance |
| Connections: 8 relationship types | ✅ exists |
| Ask: voice or text | 🟡 voice doesn't exist; text only |
| Ask: remembers context | ✅ via session state |
| Profile section list (8 sections) | 🟡 sections don't match PDF's structure |

**Profile tab section list per PDF:**
- Personality blueprint overview (Sun, Moon, Rising)
- Love and connection (Venus, Mars)
- Communication and mind (Mercury)
- Family and roots (Moon, 4th house)
- Career and purpose (Midheaven, 10th house)
- Shadow patterns (Pluto, Saturn, 8th and 12th houses)
- Current transits
- Year ahead

We have a single Chart link instead. Could expand into 8 navigable sections.

### §05 Pricing and monetization
| PDF item | Our v1 | Strategic decision |
|---|---|---|
| Free tier: 10 AI msg/day, 1 saved connection | We have unlimited everything | 🔴 Differs |
| Celestia Plus $9.99/mo or $49/yr | We removed paywall | 🔴 **DEFERRED** (we explicitly chose this) |
| 7-day free trial | Removed | 🔴 Deferred |
| Paywall trigger: 2nd connection compare | No paywall | 🔴 Deferred |

**Strategic deferral.** Our reasoning: subscription paywalls were the strongest 4.3(b) signal. Bring back in v1.1.

### §06 The TikTok content engine
| PDF item | Status |
|---|---|
| 7 viral templates | 🟡 marketing, not code |
| 30-day calendar | 🟡 marketing |
| **"Share this insight" button** on every AI output | 🔴 **NOT BUILT** — we have ShareCard for forecasts only, not for chat responses |
| Watermark on share images | ✅ ShareCard wraps with brand |
| Compatibility one-screen, two names at top | 🟡 partially — verify layout |
| AI responses 3-5 sentences with astro mid-position | ✅ system prompt updated |
| Distinctive visual identity (purple gradient) | ✅ exists |

**Gap: in-chat share button** — every AI message should have a "Share" tap that screenshots the bubble.

### §07 Apple resubmission strategy
✅ Reviewer note drafted, pre-submission checklist exists.

### §08 The 90-day execution timeline
- Project management. Not a code item.
- Worth noting: PDF Day 22-26 is "Build the paywall flow and StoreKit subscription integration." We deferred this. PDF assumed paywall ships in v1.

### §09 Metrics, risks, and what's next
| PDF item | Status |
|---|---|
| Success metrics | 🟡 instrumentation incomplete (PostHog still in flux) |
| Risk: AI cost (use Claude Haiku/Sonnet split) | 🟡 we use Gemini — different model strategy |
| v2: Pattern Across Past Partners | ⏭ post-approval |
| Couples mode (both partners install) | ⏭ post-approval |
| Pro readings $19.99 | ⏭ post-approval |

---

## Prioritized gap queue

### Tier 1 — Reviewer-impact, low effort (do before submit)

| # | Gap | Effort | Why it matters |
|---|---|---|---|
| 1 | Reword onboarding step 2 to PDF-exact: "What's something you keep repeating in love?" | 20 min | Establishes "relationship app" framing in screen 2, before any depth/birth ask |
| 2 | Replace onboarding step 3 with PDF: "How would you describe your communication style when triggered?" | 30 min | Currently "What feels most uncertain?" — too generic. PDF's question reads as relationship-clinical |
| 3 | Reframe final onboarding step (renderDailyHook) as Connections add-prompt | 20 min | PDF screen 8: "Add a partner / Skip — explore on your own" instead of feature teaser |

**Total Tier 1: ~1.5 hr.** Pure copy + UX shift. Closes onboarding-spec gaps.

### Tier 2 — Product polish, medium effort (high reviewer + retention impact)

| # | Gap | Effort | Why it matters |
|---|---|---|---|
| 4 | Today: quick-add connection card | 1 hr | PDF retention driver. Today becomes habit-forming. |
| 5 | In-chat "Share this response" button on AI bubbles | 1.5 hr | TikTok virality + screenshot-perfect output |
| 6 | Profile tab restructure: 8 PDF sections | 2 hr | When astrology toggle is ON, deep navigation; closer to PDF spec |
| 7 | Today: Drift alert ("You haven't reflected on X in 3 weeks") | 2 hr | Needs touched-at tracking on Connections |

**Total Tier 2: ~6.5 hr.** Genuine product additions. Boosts both approval feel and retention.

### Tier 3 — Substantial features (defer or include selectively)

| # | Gap | Effort | Recommendation |
|---|---|---|---|
| 8 | Pattern of the week | 4-6 hr | Defer to v1.1. Needs cross-day analytics. |
| 9 | Voice input on Ask | 4-8 hr | Defer to v1.1. iOS speech-to-text integration. |
| 10 | Bring back paywall + StoreKit (Celestia Plus tier) | 1-2 days | **Strategic decision.** Reintroducing reintroduces 3.1.x review surface. We deliberately deferred. **Keep deferred.** |
| 11 | 7 App Store screenshots production | 1-2 days design | **Manual / owner task.** Already in checklist. |

### Tier 4 — Beyond v1

| # | Item | When |
|---|---|---|
| 12 | Pattern Across Past Partners (v2 killer) | Months 4-6 |
| 13 | Couples Mode | Months 4-6 |
| 14 | Pro readings $19.99 one-time purchase | Months 6-9 |
| 15 | Live AI-moderated group readings | Months 6-9 |
| 16 | International localization (Spanish, Portuguese, Hindi) | Months 9-12 |
| 17 | TikTok content calendar execution | Marketing track, ongoing |

---

## Recommendation

**Build Tier 1 + Tier 2 now (~8 hrs).** This closes every PDF gap that's a code issue and matters for first-submission approval.

Tier 3 items 8-10 are deliberate deferrals (paywall) or defer-by-default (voice, advanced retention).

Tier 4 is post-approval roadmap.

After Tier 1 + 2 lands, we are at:
- 100% of PDF onboarding spec
- 100% of PDF tab structure
- 100% of PDF positioning + listing
- 90% of PDF post-onboarding product (missing: Pattern of week, drift alert is partial)
- 100% of PDF AI tone rule
- 100% of PDF Apple resubmission checklist
- 50% of PDF TikTok content engine (in-chat share added; calendar/templates are marketing)
- 0% of PDF monetization (deliberate deferral)

That's the effective ceiling for "fully iOS-compatible per the PDF" without making the strategic call to reintroduce paywall.

---

## Files affected by Tier 1 + 2

| Tier | File | Change |
|---|---|---|
| 1 | `OnboardingFlowScreen.js` | Reword steps 2, 3, 12 |
| 2 | `HomeScreen.js` | Add Quick-add card on Today |
| 2 | `ChatScreen.js` | Add "Share" button on AI bubbles |
| 2 | `ProfileScreen.js` | Restructure into 8 PDF sections (gated) |
| 2 | `CompatibilityScreen.js` | Touched-at timestamp on partners |
| 2 | `HomeScreen.js` | Drift alert section |
| 2 | New service `connectionsService.js` | Touched-at tracking |
