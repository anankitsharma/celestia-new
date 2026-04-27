# 09 — AI Test Plan: V1_LANGUAGE_OVERRIDE Validation

**Why this plan exists:** The chat AI is the strongest user-facing surface. We tightened `V1_LANGUAGE_OVERRIDE` to forbid all astrology vocabulary (planet names, sign names, aspect names, transit, retrograde, chart). The AI must still produce **substantive, valuable, relational responses** — not platitudes.

This plan is a **manual run** the owner does on the simulator before TestFlight. It catches:
- AI ignoring the override and leaking astro words
- AI producing thin/generic responses because we removed its richest vocabulary
- AI responses that read robotic or therapy-bot-cold instead of warm

---

## Setup

```bash
cd iOS-version
npx expo start --go --port 8082 --clear
```

Open the iOS simulator. Complete onboarding with sample data:
- Name: `Test`
- Motivation: "I lose myself in relationships"
- Communication: "I shut down"
- How understood: "Sometimes"
- Birthday: pick any (try `1996-04-15`, `12:00`, optional skip city)

Land on Today. Navigate to **Ask** tab.

You'll see the proactive insight card (V1.1): "A pattern worth naming · You said you lose yourself in relationships."

---

## Test 1 — Tap the proactive insight card

**Expected:**
- Chat opens with prefilled "Why do I lose myself in relationships?"
- AI responds with a 2-part structure: psychological frame → redirective insight
- Response uses words like: pattern, attachment, intimacy, identity, boundary, trigger
- Response does **NOT** contain: planet names, sign names, "your chart", "your Venus", "Mercury retrograde", "the universe", "manifest", "soul mate", "destiny"

**Pass example:**
> "This is a classic anxious-attachment pattern. When you care deeply about someone, the relationship starts to feel like the whole landscape — and your own contours fade. The fix isn't to care less. It's to keep one foot inside yourself even when the other is reaching toward them."

**Fail example A — astrology leak:**
> "Your Venus in Cancer makes you bond hard..." ❌ (any planet/sign mention)

**Fail example B — platitude:**
> "Self-discovery is a journey. Trust your inner wisdom." ❌ (vague, no substance)

---

## Test 2 — Direct astrology probe

Send: **"Tell me about my Venus."**

**Expected:** AI redirects without naming the planet. Response should describe the user's love pattern in psychological terms.

**Pass:**
> "I don't share astrological details directly — but the pattern in how you love is something I can describe. From what your blueprint shows, you tend to give a lot, then watch quietly to see if it gets noticed..."

**Fail:**
> "Your Venus is in [sign]..." ❌

---

## Test 3 — Direct chart probe

Send: **"What does my chart say about love?"**

**Expected:** AI redirects to "blueprint" or "pattern" terminology. No "chart" word.

**Pass:**
> "Your blueprint suggests you're built for intense, all-in connections — and that intensity costs you when the other person can't match it..."

**Fail:**
> "Your chart shows..." ❌ or "Your natal Venus..." ❌

---

## Test 4 — Specific relationship question

Send: **"Why does my mom keep making passive-aggressive comments about my career?"**

**Expected:** AI gives a substantive psychological reading. Tone is warm but direct.

**Pass:**
> "That kind of repeated behavior usually has more to do with her own unresolved patterns than yours. Maternal criticism often lands deeper than it deserves to — there's an old wiring in us that absorbs it as a verdict on our worth. The pattern won't change because she changes. It can change because you stop receiving it as truth."

**Fail signals:**
- Astro words ❌
- "I can help you with that" with no actual help ❌
- Pure validation without insight ❌

---

## Test 5 — Open-ended self-discovery

Send: **"What's my biggest blind spot?"**

**Expected:** AI uses onboarding answers as context (motivation = `lose_self`). Response should reference that pattern specifically.

**Pass:**
> "From what you shared, your biggest blind spot is the moment self-loss starts. By the time you notice you've shape-shifted to fit them, you're three months in. The shift is subtle — it doesn't feel like losing yourself, it feels like being a 'good partner.' Watch for it on the small choices first."

**Fail:**
> Generic "everyone has blind spots" answer ❌

---

## Test 6 — Career question

Send: **"Should I take this new job offer?"**

**Expected:** AI doesn't predict the future. Reframes around self-knowledge.

**Pass:**
> "I can't tell you yes or no — but I can ask you what's underneath the question. When you imagine taking it, what's the dominant feeling? When you imagine declining, what's the feeling? Sometimes the body answers before the mind catches up."

**Fail:**
> "Yes, this is a good time to make a career change." ❌ (predictive)
> "Mars is in your 10th house..." ❌ (astro)

---

## Test 7 — Compatibility question (after adding a partner)

Add a partner in Connections (any name + birth data). Return to Ask. Tap the partner's "Ask about [name]" chip.

**Expected:** AI talks about the relationship dynamic in plain terms.

**Pass:**
> "From the patterns I see between you and Sarah, your communication styles are mirror-opposite — she processes externally and you process internally. That's not a flaw; it's a feature you can work with."

**Fail:**
> "Sarah's Mars is conjunct your Venus..." ❌

---

## What to look for across all tests

### ✅ Pass criteria
- [ ] Zero planet names anywhere (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto)
- [ ] Zero zodiac signs (Aries through Pisces)
- [ ] Zero aspect names (conjunction, square, trine, opposition, sextile, quincunx, retrograde)
- [ ] Zero "your chart", "your natal chart", "your birth chart", "transits"
- [ ] Zero "the universe", "the cosmos", "manifest", "destiny", "soul mate", "sacred"
- [ ] Responses are substantive (>3 sentences typically) and reference the user's actual data when relevant
- [ ] Tone is warm but not mystical-influencer
- [ ] Uses framework vocabulary: pattern, attachment, intimacy, threshold, mirror, trigger, wiring, blueprint
- [ ] Closes with redirective insight (2-part structure)

### ❌ Fail signals
- Any banned word above appears
- Response is generic / could be on a fortune cookie
- Response is predictive ("you will...", "the answer is yes")
- Response references chart elements directly
- Response uses mystical "energy" framing

---

## What to do if a test fails

### If astrology words leak:
The override didn't catch it. Either:
1. The model is overriding the system instruction (rare but possible) — try regenerating
2. The vocabulary list is missing a word — add it to V1_LANGUAGE_OVERRIDE in `src/services/geminiService.js`
3. The override isn't being injected for this code path — check `generateWithFallback` is the entry point

### If responses are thin / platitudes:
The override is too restrictive. Symptoms:
- AI hedges constantly
- AI redirects without insight
- AI sounds like a therapy chatbot, not a thoughtful friend

Fix: relax the "TWO-PART STRUCTURE" rule slightly. The previous 3-part structure included an "astrological reference" middle sentence which gave the AI rhetorical grip. Without it, responses can feel disembodied. Try:
- Add 2-3 more example responses to the override (psychology-rich, no astro)
- Allow specific words back in if they're functional ("rhythm", "season" used non-astrologically)

---

## Document your findings

After running all 7 tests, fill in:

```
Test 1 (proactive insight):  [ ] PASS  [ ] FAIL — notes:
Test 2 (Venus probe):        [ ] PASS  [ ] FAIL — notes:
Test 3 (chart probe):        [ ] PASS  [ ] FAIL — notes:
Test 4 (mom question):       [ ] PASS  [ ] FAIL — notes:
Test 5 (blind spot):         [ ] PASS  [ ] FAIL — notes:
Test 6 (career):             [ ] PASS  [ ] FAIL — notes:
Test 7 (compatibility):      [ ] PASS  [ ] FAIL — notes:

Overall: SHIP / ITERATE / BLOCK

Top 3 issues to fix:
1.
2.
3.
```

If 6 of 7 pass with substantive responses → ship.
If less than 5 pass or any fail by leaking astro words → iterate on the override.

---

## Time budget

- Setup: 5 min
- Run all 7 tests: 15 min (Gemini latency + reading responses)
- Document findings: 5 min
- **Total: ~25 minutes**

Run this test once before TestFlight, once after, and once before final submission.
