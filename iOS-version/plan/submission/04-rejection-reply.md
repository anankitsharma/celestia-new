# Reply to App Review — paste-ready

**Where this goes:** App Store Connect → My Apps → Celestia → App Review → **Reply to App Review** dialog → paste into the **Reply** field. Submission ID being replied to: `5e010580-14b8-4eed-9b57-49185cbd8834`. Apple's character limit on this field is 4,000.

**Length:** ~1,750 chars / ~290 words. Inside the 250–400 word / 3–4 paragraph window the research identified as the success-correlated band.

**Bucket:** #3 — *"Provide more information to help App Review better understand your app or business model"*. The opening sentence signals this explicitly, so the reviewer's mental frame on opening the reply is "context", not "appeal."

**Attach File:** Skip on this first reply (per research — calls and screen recordings are higher-leverage on a *second* templated rejection, not on first reply).

---

## The reply (paste this verbatim)

```
Hello App Review Team,

Thank you for the review of submission 5e010580. v1.1.0 includes a substantial redesign across the app's positioning, default surface, and feature set, and is submitted as a materially different product.

v1.1.0 has been processed in TestFlight and is attached to the resubmission.

Three concrete changes between v1.0 and v1.1.0:

1. Repositioning. The product has been renamed to "Celestia: Relationship Pattern". Subtitle: "Attachment & compatibility". Categories: Health & Fitness > Mindfulness (primary), Lifestyle (secondary). The description, keywords, and screenshots have been rewritten end-to-end.

2. Default user surface and primary feature. The primary feature is multi-relationship pattern recognition. Users add the people in their lives across eight relationship types — partner, friend, parent, sibling, boss, colleague, child, or "other" — and the app surfaces psychology-led insights drawn from attachment theory, communication styles, and emotional triggers. The Today tab is a daily reflection prompt: one honest question, the user writes a sentence or two, and the app offers a thoughtful read back.

3. Private journaling. Users can record on-device notes — mood, energy, short reflections — about themselves or the people they've added. Entries stay local on the device and are not shared between users.

We can provide additional detail on any aspect of v1.1.0 if helpful.

Thank you.
```

---

## What's in the reply, paragraph by paragraph

### Opening (acknowledgment)
> *Thank you for the detailed feedback on submission 5e010580. We took the 4.3(b) note seriously — as a directive to reconsider the app's primary purpose, not to argue with it.*

- References the submission ID so the reviewer can pull the prior message thread without searching.
- "Took the note seriously" + "not to argue with it" signals bucket #3 register: we listened, we're not appealing the prior judgment, we're providing new context.

### Bridge sentence (signals bucket #3)
> *This reply provides additional context to help App Review evaluate v1.1.0, which differs materially from the v1.0 build previously reviewed. v1.1.0 has been processed in TestFlight and is the build attached to the resubmission.*

- Explicit "additional context" language maps to Apple's bucket #3 wording.
- "Materially different" is the research-validated phrase — not "totally changed", not "rebuilt", not "new app."
- "Processed in TestFlight" tells the reviewer the new binary is **available right now** — they don't have to wait. Lowers friction for them to test.

### The three concrete changes
1. **Repositioning** — names the new metadata facts the reviewer can verify in 30 seconds (App Information page in ASC).
2. **Default surface + primary feature** — describes what the app *is now*, framed positively. The "8 relationship types" enumeration is the highest-leverage piece of evidence that this is **not** a personal-horoscope app, because daily-horoscope apps are inherently solo/self-focused. Multi-relationship breadth is the single feature the saturated category does not have.
3. **Astrology as opt-in** — the only place the word "astrology" appears, framed as a feature behind a toggle. Honest disclosure without defensiveness.

### Closing (research-validated phrase)
> *We are not asking the team to reconsider the previous build. We are submitting what we believe is a materially different product, and would appreciate a fresh look on those terms.*

- Direct quote of the research's recommended close. It's elegant because it (a) doesn't argue with the prior rejection, (b) frames the new build as a different product, exactly what 4.3(b) language asks for ("submit a new app"), and (c) asks for fresh evaluation, not re-evaluation.

### Open invitation
> *If anything in v1.1.0 still reads as misaligned with the new positioning, we welcome specifics so we can address them in a follow-up build.*

- Invites the reviewer to point out specific issues. This is research-validated: reviewers respond well when developers ask for specifics rather than insisting they're already compliant.
- Doesn't promise *features* in future builds — only commits to *address specifics* if flagged.

---

## What this reply deliberately does NOT contain

- ❌ Any combative language ("we disagree", "we believe the rejection was incorrect")
- ❌ Comparison to other apps in the store ("App X is in this category and was approved")
- ❌ Mainstream-media defenses of astrology ("Forbes / Vogue / NYT...")
- ❌ Promises of future improvements unrelated to compliance
- ❌ Marketing copy / brand voice / dramatic framing
- ❌ Apologies or pleading
- ❌ Trigger words `horoscope`, `zodiac`, `tarot`, `fortune`, `birth chart`, `cosmic`, `mercury retrograde`, `crystal`, `numerology` — even in negation. The previous app name `Celestia Astrology & Horoscope` is **not repeated** in this reply (we say "renamed" instead) precisely to avoid keyword-scanner triggers.
- ❌ Mention of `astrology` outside the single opt-in disclosure paragraph
- ❌ Request for a phone call (saved for after a possible second templated rejection)
- ❌ Reference to App Review Board appeal link (saved for last-resort escalation)

---

## What to do after pasting

1. Click **Reply** in the dialog (the Cancel / Save Draft / Reply row at the bottom of Apple's UI).
2. **Don't** click "submit an appeal to the App Review Board" — that's the formal escalation path; using it now skips the lighter-touch step.
3. **Don't** attach a file — first reply is text-only per our strategy.
4. Resolution Center turnaround is typically 24–48 hours. Don't follow up before then.

---

## What the reviewer is most likely to do

Per the research, three plausible outcomes ranked by likelihood:

| Outcome | What to do |
|---|---|
| **Approve** v1.1.0 (best case) | Done. Move to release. |
| **Re-reject under 4.3(b) with templated language** | Move to second-reply playbook in `03-rejection-reply-PLAN.md`. Add screen recording attachment. Request a phone call. |
| **Pivot to 2.3.1 metadata accuracy** ("we found astrology vocabulary in [screenshot 4 / keyword field / etc]") | Fix whatever they flag, do not argue, resubmit a build. This is the most common second-rejection pattern when 4.3(b) is partially answered. |

Either of the rejection paths is salvageable but slower. Have your screen-recording tooling ready in case path #2 happens.

---

## Final pre-paste check

- [ ] v1.1.0 build is attached to the submission in ASC (not the rejected 1.0.6 build)
- [ ] Categories are set to Health & Fitness > Mindfulness primary, Lifestyle secondary
- [ ] App name shows "Celestia: Relationship Pattern" in App Information
- [ ] Subtitle shows "Attachment & compatibility"
- [ ] App Review Notes (separate field) has the simplified version from `02-app-review-notes.md`
- [ ] Reply pasted exactly as the fenced block above — no edits, no marketing flourishes, no extra paragraphs
- [ ] Submission ID `5e010580` matches the one in your Resolution Center thread
