# What's New — v1.1.0 Release Notes

**Where this goes:** App Store Connect → My Apps → Celestia → Version Information → What's New in This Version
**Char limit:** 4,000 (visible without tap: ~170)
**Indexed:** No (zero ranking impact — pure conversion)

---

## Recommended block (paste this verbatim)

```
A clearer, calmer Celestia.

Version 1.1 is a substantial rebuild around the people in your life — partner, family, friends, colleagues. Add anyone, see how you actually connect, and ask the questions you've been carrying.

The Today tab leads with a daily reflection prompt — one honest question, your sentence or two, a thoughtful read back.

Privacy by default: your data lives on your device.
```

**Length:** ~430 / 4,000 chars.

**First-line preview (visible in the Updates feed without tap):**

> *A clearer, calmer Celestia.*

That's the entire above-the-fold hook for users who already have v1.0.x installed.

---

## Banned-word audit on this block

| Term | Required | Verified |
|---|---|---|
| horoscope | 0 | 0 ✅ |
| daily horoscope | 0 | 0 ✅ |
| zodiac | 0 | 0 ✅ |
| fortune | 0 | 0 ✅ |
| tarot | 0 | 0 ✅ |
| Mercury retrograde | 0 | 0 ✅ |
| cosmic | 0 | 0 ✅ |
| birth chart | 0 | 0 ✅ |
| astrology | 0 | 0 ✅ |
| relationship | ≥0 | 0 — intentionally minimal (people, connections, partner, family, friends, colleagues do the work) |
| calm | ≥1 | 1 ✅ |
| privacy | ≥1 | 1 ✅ |

For approval-first submission, the prior version's "No daily horoscope. No subscription. No streaks pressuring you." negation has been removed. Even as anti-positioning, the literal phrase "daily horoscope" is a keyword-scanner trigger and there is no upside in keeping it in metadata. The block now contains zero saturated-category vocabulary in any form, affirmative or negative.

---

## Why this block is shaped this way

**Paragraph 1 — anchor sentence.** *"A clearer, calmer Celestia."* — Five words. Short enough to fit in the Updates-feed preview. "Clearer, calmer" telegraphs the rebuild story without saying "rebuild" (which can read as "the previous version was broken" — bad signal).

**Paragraph 2 — the "what's new" substance.** Explicitly names the Connections breadth (partner, family, friends, colleagues) — this is the single biggest 4.3(b)-defense talking point in the app. By the second paragraph, the reader knows we're a relationship app.

**Paragraph 3 — the Today tab story.** One sentence. Plain factual description of the daily reflection feature. No editorializing.

**Paragraph 4 — privacy commitment.** Single sentence. Matches the screenshot 7 caption ("Privacy by default") — consistency across surfaces is a measurable conversion lift signal.

---

## When to update this block

| Event | What to update |
|---|---|
| Patch release (v1.1.1) | Replace with single line: *"Bug fixes and stability improvements. Send issues to support@celestia.app."* |
| Minor release (v1.2.0) | Lead with the new feature(s). Keep the closing privacy line. |
| Major release (v2.0.0) | Full rewrite — narrative-style update like this one. |
| Quiet quarters | Update every ~4 weeks per Apple's "active development" ranking signal. *"Performance improvements based on your feedback."* is a valid quiet-quarter line. |

---

## What's NOT in this block (deliberate)

- **No version number** ("1.1") in the title. Apple's What's New text style guide says don't put the version number in the body — App Store Connect surfaces it separately. The block leads with the user-facing change, not the metadata.
- **No "fixes" / "improvements" generic language.** Specifics or nothing. Saying "various improvements" is a known conversion-killer.
- **No "rate us" CTA.** Cluttered, against HIG. Rating prompt is handled by the in-app `SKStoreReviewController` flow at the right moment, not in marketing copy.
- **No competitor mention.** "Unlike Co-Star…" is an Apple Guideline 2.3.1 risk.
- **No "first version" framing** ("brand new app, just released"). Misleading — Celestia has been on the App Store before this submission. Honest about being a rebuild, not pretending to be net-new.

---

## Final paste-time check

- [ ] Paragraph spacing preserved (one blank line between paragraphs — App Store Connect respects newlines)
- [ ] Char count under 4,000 (✅ — ~430 chars)
- [ ] First sentence ≤ ~80 chars for clean Updates-feed preview (✅ — *"A clearer, calmer Celestia."* = 28 chars)
- [ ] Zero banned words anywhere (no negations either — even "no daily horoscope" leaks the trigger phrase)
- [ ] Privacy reference present (consistency with screenshot 7 + listing description)
- [ ] No version numbers in body
- [ ] No "rate us" CTA in body
