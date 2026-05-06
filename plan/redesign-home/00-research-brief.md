# HomeScreen Redesign — Research Brief

**Status:** research-only. No design proposals in this folder yet — that's the next step after this synthesis is reviewed and the principles are agreed.

## Why we're doing this

The current HomeScreen ("Today" tab) reads cluttered against the canonical persona, **Mia Reyes** (`plan/ideal-user/Celestia-Mia-Reyes-Persona.html`). Today stacks a navigator briefing + summary + 4–5 do items + 3–4 avoid items + 5 life-area cards + sky section + journal CTA + streak/level pills + multiple CTAs. Mia opens the app at 10:30pm, in bed, emotionally activated by a trigger event (left on read, Sunday anxiety, new guy, TikTok hit). Her cognitive budget is: low, hot, fast.

Before we cut sections we need to understand how the apps Mia *already* lives in have solved "captured attention at a low-cognitive-budget moment." Borrowing her existing muscle memory beats inventing a new grammar.

## Mia in one paragraph (recap)

24, Austin, marketing coordinator, $44k/yr, single, situationship-prone. Knows her Big 3. Lapsed Co-Star. Phone 6.5 hrs/day. **Peak window: 9:30pm–midnight, in bed, alone.** Triggers: left on read, Sunday anxiety, new guy, TikTok hit her, work stress, birthday soon. Types real life questions disguised as astrology questions. Screenshot-to-group-chat is her sharing reflex. Sundays are her deep session; weekdays are in-and-out.

## The Mia Test (from her persona doc)

Every screen/feature must pass three tests:
1. **Product** — would Mia use this at 10:30pm in bed?
2. **Marketing** — would she screenshot it and send to group chat?
3. **Revenue** — would she pay $9.99 for this without thinking twice?

These are the only acceptance criteria for the redesign.

## Research questions

The point of `01-app-pattern-audit.md` is to answer:

1. **What is the atomic unit** in each app she uses? (a TikTok video, a Story tap, a Hinge prompt card, a Co-Star daily?)
2. **What's the entry rhythm?** When she opens the app, what greets her — a feed, a single card, a question, a wall of text?
3. **What is "good" content** in each app? What does the first 2 seconds look like?
4. **What makes a piece shareable?** Specifically screenshot-to-group-chat-able.
5. **What's the friction model?** How much work to get to depth?
6. **Where does the app fail?** Patterns Mia tolerates but doesn't love — Co-Star's coldness, Stories' algorithm fatigue, etc. Don't import the failures.

## Apps in scope

Ranked by how much time Mia spends in them and how relevant the pattern is to "open at 10:30pm, want to feel seen":

| App | Mia hours/day | Why it's in scope |
|---|---|---|
| TikTok | 2+ | Default attention pattern. Vertical, single card, swipe. Algorithm is her dopamine baseline. |
| Instagram (Stories + Feed) | 1.5 | Saves carousels, shares to friends, screenshots stories. Direct overlap with screenshot-to-share. |
| iMessage / Group chat | All day | The destination of every screenshot. Defines what content "wins." |
| Co-Star | (lapsed) | Direct competitor. She tried it. Whatever made her bounce is something we must not repeat. |
| Hinge | (active) | She's situationship-prone, dating. Hinge prompts = one question at a time, depth-on-tap. The right interaction grammar for self-reflection. |
| Pinterest | 30m | "Research mode" — deep, visual, save-and-curate. Different cognitive state. |
| BeReal | (varies) | One moment a day, ephemeral, screenshot-able. Useful pattern for "today's anchor." |
| Snapchat | (lower) | Streaks she understands. Daily ritual mechanic. |

Out of scope for now (don't fit her behavior pattern): Threads, X, Reddit, LinkedIn, Sanctuary, The Pattern (we already know our positioning vs them).

## Deliverables in this folder

1. **`00-research-brief.md`** — this doc.
2. **`01-app-pattern-audit.md`** — per-app analysis answering the 6 research questions above.
3. **`02-transferable-principles.md`** — the 4–5 cross-app principles that should constrain the HomeScreen redesign, plus what each principle implies for what gets cut, kept, or reshaped.

After review of these three, we move to design proposals (separate folder / phase).

## Hard constraint going in

We are not designing a TikTok feed inside an astrology app. We are extracting the *underlying behavioral principle* from each pattern — one-thing-at-a-time, swipeable, made-to-screenshot, visual-first, daily-anchor — and applying those to a Today screen that still serves Mia's actual job: "help me make sense of myself tonight."
