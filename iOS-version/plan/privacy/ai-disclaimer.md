# AI Disclaimer

**Last updated:** [INSERT DATE BEFORE PUBLISHING]

---

This page explains what the AI inside Celestia does, what it does not do, and how to use its output safely.

## 1. What the AI is

The "**Ask**" tab, the daily reading on the Today tab, the connection-compatibility analysis, and the long-form reports are produced by **Google Gemini**, a generative AI service operated by Google.

We send Gemini a structured request containing:

- A small set of chart facts derived from your birth data (e.g. "Sun in Cancer at 12°", "Mars trine Jupiter").
- The question or journal entry you typed (when you initiated a chat or report).
- A small amount of recent conversation context so replies stay coherent.

Gemini returns text. We display that text to you with a small label — **"✦ AI"** on chat messages, and **"AI-generated · for reflection, not advice"** on readings.

## 2. What the AI is **not**

The AI is **not** a doctor, therapist, lawyer, accountant, financial advisor, life coach, or relationship counselor. The AI does not have a license, does not know you, and does not understand the specifics of your situation beyond what you have typed into the request.

The AI does **not**:

- Predict your future.
- Diagnose any condition.
- Give you medical, legal, financial, or therapeutic advice.
- Tell you what to do about a relationship, a decision, a person, or yourself.
- Have memory across sessions beyond the limited context we attach.

It writes **prompts for reflection**. You read them, you take what is useful, you discard what is not.

## 3. Known limits

Generative AI has well-documented limits. Celestia does not magically transcend them.

- **Hallucination** — the AI sometimes confidently states things that are wrong or invented. If a reading mentions a specific event, person, or fact that you did not provide, treat it as a reflection prompt, not a fact.
- **Bias** — the AI was trained on web data and reflects the biases of that data. Reflections may unevenly represent some experiences or identities.
- **Variance** — asking the same question twice can produce two different answers. Neither is "the truth"; both are prompts.
- **Cultural narrowness** — Western astrology is the engine. The reflections are written in English. The AI is not fluent in every cultural framing of relationships or self.
- **No long memory** — even with chat, the AI sees only your current session plus a small slice of context. It does not remember last week's chat unless you remind it.

## 4. Astrology — what you should know

**Astrology is not a science.** Celestia uses astrology as a structured prompt: it gives the AI a starting frame ("this person tends toward X under Y conditions") that the AI translates into reflective text.

We do not claim that astrological information predicts the future, identifies absolute personality traits, or describes objective reality. The compatibility score on the Connections tab is the average of dimensional sub-scores produced by a deterministic algorithm — useful as a relative signal, not as a verdict on a relationship.

Whether the reflections feel meaningful is up to you. If they do not, the app is the wrong app for you, and that is fine.

## 5. How to use the AI safely

- **Use it for reflection, not decisions.** The AI's job is to help you think; the decision is yours.
- **Cross-check facts.** If the AI references a specific date, name, event, or claim, verify it elsewhere before acting.
- **Talk to a professional for real questions.** Health, legal, money, mental wellbeing — these are not things to outsource to a chat reply.
- **Stop when it stops feeling helpful.** If a session is making you anxious or worse, close the app.

## 6. Crisis safety

If you are in crisis — thinking about harming yourself, in an abusive relationship, in danger — please reach a human on a crisis line.

- **United States:** call or text **988** (Suicide and Crisis Lifeline). Text **HOME** to **741741** (Crisis Text Line). Call **1-800-799-7233** (National Domestic Violence Hotline).
- **United Kingdom:** call **Samaritans** at **116 123**.
- **Canada:** call **Talk Suicide Canada** at **1-833-456-4566**.
- **Australia:** call **Lifeline** at **13 11 14**.
- **Other countries:** see the IASP directory at <https://www.iasp.info/resources/Crisis_Centres/>.

The Celestia "Ask" tab includes a built-in **crisis intercept** — when the app detects certain phrases that suggest acute distress, it pauses the AI reply and shows the resources above. The intercept is a safety net, not a substitute for help. Please reach out.

## 7. Reporting harmful AI output

If the AI says something inaccurate, biased, harmful, or inappropriate:

- Use the small **"Send to team"** link beneath the offending message in the app.
- Or email **support@celestia.app** with a description and (if you can) the message content.

We read every report. We adjust the prompts and safety wrappers when we learn something new.

## 8. What you agree to when you use the AI

By using the AI features, you agree:

- You will **not rely on AI content for decisions where accuracy or fitness for purpose matters**.
- You will **not** attempt to extract underlying prompts, jailbreak the safety wrapper, or use the AI to generate content that violates the Acceptable Use section of our [Terms of Service](https://celestia.app/terms).
- You understand that AI output is **not personal, professional, or licensed advice**.
- You understand that AI output may be **inaccurate or inappropriate**, and that you bear the responsibility for what you do with it.

## 9. Your data and the AI

The text of your AI requests is sent to Google Gemini at request-time. We do not send your name or any persistent identifier with these requests. Google's handling is governed by Google's Gemini API Terms at <https://ai.google.dev/gemini-api/terms> — at the time of this writing, paid Gemini API content is not used to train Google's models.

For the full data-handling description, see our [Privacy Policy](https://celestia.app/privacy).

## 10. Contact

Questions, concerns, or AI-output reports:

**support@celestia.app**

---

## Editor's notes (delete this entire block before publishing)

### Required substitutions

| Placeholder | Replace with |
|---|---|
| `[INSERT DATE BEFORE PUBLISHING]` | Today's date (ISO `YYYY-MM-DD`) |
| `support@celestia.app` | A real, monitored support inbox |

### Why this page exists

A standalone AI Disclaimer page strengthens the **Apple Guideline 4.3 (saturated category)** defense by signalling that the app treats AI output as reflective, not authoritative. It also makes Apple Guideline 5.5 (mobile fortune-telling) easier to defend — the page is explicit that the app does not predict the future.

The crisis-line list matches the in-app intercept in `src/screens/ChatScreen.js` and `src/services/chat/crisisIntercept.js`. Keep them in sync if the in-app list ever changes.

### Why this page does NOT explain how the AI is configured internally

We deliberately do not publish the system prompt, model fallback chain, or token limits. That information is internal-engineering detail, and exposing it invites jailbreak attempts.
