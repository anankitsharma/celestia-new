# 02 — B=MAP Diagnostic

Applying BJ Fogg's Behavior Model: **Behavior = Motivation × Ability × Prompt**.

A behavior happens only when all three are simultaneously above the Action Line. Below it, no prompt works. The reliable strategy is to make behaviors **easier** (raise Ability), not to pump up motivation.

We score each retention checkpoint on M / A / P (0–10) and flag the **weakest link** — that's the one to fix first.

---

## Checkpoint 1 — D0: Install → finish onboarding

**Target behavior:** complete the 12-step onboarding and see the chart reveal.

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 9/10 | Curiosity is sky-high right after install. App Store promise is fresh. |
| Ability | 6/10 | 12 steps is long. Birth time is a hard ask (many users don't know it). Step 5 (attachment) adds psychological depth but also cognitive load. |
| Prompt | 10/10 | Splash → onboarding is a continuous in-app prompt; no friction here. |

**Action line status:** Above the line for most installers — the chart reveal is the payoff.

**Weakest link: Ability.** Birth-time-unknown is the silent killer. Mental effort during attachment-theory step is the second.

**Recommendations:**
- Add an explicit "I don't know my birth time" path with a sun-only chart fallback (don't block the aha).
- Show a progress bar with steps remaining ("3 of 12") to reduce time-perception load.
- Offer a one-tap "skip and come back later" only on optional steps — never on birth data.

---

## Checkpoint 2 — D0 (post-chart): first AI chat or first report

**Target behavior:** after seeing the chart, do one more action (send a chat OR open a report).

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 7/10 | High right after reveal but already drifting. The "Big 3 + 2 statements" pattern is the peak — everything after is mild. |
| Ability | 4/10 | No clear "what to do next" path. User lands on the chart reveal and the natural exit is the home button. The next-action prompt does not exist. |
| Prompt | 2/10 | **No prompt fires at this moment.** No tooltip, no celebratory CTA, no "tap one of these to go deeper." |

**Action line status: BELOW the line.** Most users will not take a second action.

**Weakest link: Prompt.** This is the single most expensive miss in the app — it's the moment of highest motivation and lowest prompt density.

**Recommendations:**
- Add a celebration moment after chart reveal (Hook Model: reward before investment).
- Immediately follow with an anchored prompt: "Want to ask Celestia why your moon is in the 7th house?" → one-tap into pre-filled chat.
- Offer notification permission *here*, not later — motivation will never be this high again.

---

## Checkpoint 3 — D1: install + 1 day, app reopen

**Target behavior:** open the app on calendar day 1.

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 4/10 | Aha has faded. User has 50+ other apps competing for attention. |
| Ability | 9/10 | App is installed, icon is on homescreen — opening costs ~1 second. |
| Prompt | 5/10 | Cosmic Morning push fires at 7:30am — but only if user opted into notifications during onboarding. Copy is template-driven, may or may not connect to D0 personalization. |

**Action line status:** Marginal. ~30–50% return rate is plausible if push is enabled, ~10–20% if not.

**Weakest link: Prompt.** The morning push is generic — it does not reference what the user just learned about themselves yesterday.

**Recommendations:**
- Day-1 push must reference D0 content: "Yesterday you learned your moon is in the 7th house. Here's how it shows up today."
- If notification permission was declined, fire a one-time in-app banner the next time they open the app: "Mornings are when this app is most useful — turn on notifications?"
- Anchor the prompt to an existing routine: "After your first coffee, here's your day."

---

## Checkpoint 4 — D2–D3: keep returning daily

**Target behavior:** open the app 2–3 days in a row to start a streak.

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 3/10 | Novelty has worn off. Without a streak yet, no loss-aversion is in play. |
| Ability | 9/10 | Same as D1. |
| Prompt | 5/10 | Same morning push. Streak Guardian doesn't fire until streak ≥3. |

**Action line status: BELOW the line for many users.** This is where the first big drop-off happens.

**Weakest link: Motivation, then Prompt.** The streak system can't activate until D3 — but motivation needs propping up *before* then.

**Recommendations:**
- Show "streak: 1 day, 1 day from your first badge" on D1 close. Loss aversion needs an existing thing to lose.
- Day-2 push: "Day 2. Almost at your first milestone (✨ 3-day streak)." Anticipation as motivator.
- Surface the streak freeze proactively on D2: "Heads up — you have 1 free streak freeze. Use it later if life gets busy."

---

## Checkpoint 5 — D7: complete first week

**Target behavior:** at least 5 of 7 days active in week 1, ideally a 7-day streak.

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 5/10 | If user has 4–5 day streak, loss aversion kicks in (won't break it). If they're sporadic, motivation is low. |
| Ability | 9/10 | Same. |
| Prompt | 7/10 | Streak Guardian (9pm) is now firing. Cosmic Morning continues. Lapse cascade ready if they slip. |

**Action line status:** Above the line for users who hit a 3+ day streak. Below the line for sporadic users.

**Weakest link: Motivation for sporadic users.** Streak Guardian only protects existing streaks — sporadic users see no urgency.

**Recommendations:**
- For users with no streak yet by D5, fire a "fresh start" push: "Start your streak tonight — most people who do hit 7 days within a week."
- Variable rewards must escalate: D7 hit should unlock a *surprise* (new badge animation, AI-generated personal letter from Celestia, etc.) — currently the D7 badge is the *expected* outcome.
- Show social proof: "You're in the top X% of users who hit a 7-day streak this week."

---

## Checkpoint 6 — D14–D30: habit formation

**Target behavior:** open the app on most days, send chats unprompted, write a journal weekly.

| Element | Score | Reasoning |
|---|---|---|
| Motivation | 6/10 | Streak loss-aversion is now significant (✨ 30-day badge in sight). XP/level progression visible. But: forecast content is starting to feel patterned. |
| Ability | 9/10 | Same. |
| Prompt | 5/10 | Time-based pushes still firing daily. **No internal trigger has been established yet** — user still needs the push to remember. |

**Action line status:** Marginal. The product still depends on external prompts.

**Weakest link: the missing internal trigger.** Hook Model: by D30 the user should be opening the app *because they feel an emotion the app resolves*, not because the morning push fired.

**Recommendations:**
- Pick one internal trigger and design for it ruthlessly. Strongest candidate for Celestia: **uncertainty about a relationship or decision.** Make Celestia the automatic answer to "I don't know what to do about [person]."
- Every chat suggestion in the prompt pool should map to that emotion. Every push in week 3+ should trigger that emotion.
- Variable reward: by D14, introduce a *new content type* that wasn't there in week 1 (e.g., weekly pattern recognition, partner-specific insights). Stop showing the same daily-briefing structure.

---

## Checkpoint 7 — D30+: paid conversion

**Target behavior:** convert from free to paid (once paywall re-enables).

| Element | Score | Reasoning |
|---|---|---|
| Motivation | ? | Cannot measure — no analytics, no funnel. Likely moderate for users with 30-day streak (high investment). |
| Ability | N/A | Paywall is stubbed. |
| Prompt | 0/10 | No upsell prompt fires anywhere. |

**Weakest link: this entire checkpoint doesn't exist yet.**

**Recommendations:** see `04-churn-prevention.md` and `06-30day-playbook.md`.

---

## Cross-cutting Ability Chain audit

The Ability Chain has six factors. Rate each for the Celestia core daily action ("open app + read forecast"):

| Factor | Rating | Notes |
|---|---|---|
| Time | 5/5 | < 30 seconds to read the briefing. ✓ |
| Money | 5/5 | Free tier currently full-fat. ✓ |
| Physical effort | 5/5 | One tap to open. ✓ |
| Mental effort | 3/5 | Briefing is dense — energy scores + life areas + journal prompt + quests is a lot. Could overwhelm low-motivation moments. |
| Social deviance | 5/5 | Astro is well-normalized; psychological framing in V1 makes it even more mainstream. ✓ |
| Non-routine | 2/5 | **The weakest link.** Most users don't have a daily astro/reflection routine. The behavior IS new for them. |

**Implication:** Anchor the morning briefing to an existing routine. Onboarding question: "When do you usually check your phone for the first time in the morning?" → schedule push 5 minutes after that.

---

## Summary: highest-leverage fixes ranked by checkpoint

| Rank | Checkpoint | Fix | Skill | Effort |
|---|---|---|---|---|
| 1 | D0 post-chart | Add celebratory next-action prompt + permission ask | B=MAP (Prompt) | M |
| 2 | D0 onboarding | "I don't know my birth time" path | B=MAP (Ability) | S |
| 3 | D14+ | Define + design for internal trigger | Hook (Trigger) | L |
| 4 | D1 morning push | Personalize to D0 chart content | B=MAP (Prompt) | M |
| 5 | D2–D3 | Proactive streak-freeze offer + "fresh start" copy for non-streakers | Hook (Investment + Reward) | S |
| 6 | D7 milestone | Variable surprise reward, not just expected badge | Hook (Reward) | M |
| 7 | All checkpoints | Anchor morning push to user's routine, not 7:30am default | B=MAP (Prompt) | S |

See `03-hook-model-loops.md` for the loop redesign and `05-7day-playbook.md` for the day-by-day implementation.
