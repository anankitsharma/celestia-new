# Psychology and Engagement Analysis: Celestia Notifications

## 1. The Hook Model Framework
The notification engine in Celestia is explicitly engineered around behavioral design, specifically Nir Eyal's **Hook Model** (Trigger → Action → Variable Reward → Investment). It avoids generic broadcasting in favor of context-aware, personalized nudges.

- **External Triggers Built on Investment:** Pushes like `JOURNAL_PATTERN` perfectly demonstrate how "investment loads the next trigger." The user invests effort by writing in their journal. The app analyzes that investment to generate the *next* trigger: *"You wrote about [Theme] 3 times this week. Worth reading the pattern out loud."* 
- **Anticipation Over Realization:** The `STREAK_ANTICIPATION` push fires the day *before* a major milestone (e.g., Day 6, Day 13). This leverages the neurological fact that dopamine spikes highest in *anticipation* of a reward, rather than during the receipt of the reward itself. It builds immense momentum for the next day's open.

## 2. Loss Aversion (Kahneman's Prospect Theory)
The system understands that the psychological pain of losing something is roughly twice as powerful as the pleasure of gaining it.
- **Badge Rescue (`BADGE_RESCUE`):** When a user is 1-2 actions away from a milestone, the push doesn't just offer a reward; it subtly implies the loss of built-up momentum.
- **Trial Ending (`TRIAL_ENDING`):** Instead of a generic billing warning, the app calculates exactly what the user has invested during the trial (e.g., *"12 journal entries, 3 chats so far"*). It then uses a loss-frame: *"After tomorrow: no daily Pro insight..."* This forces the user to actively weigh abandoning their own generated data against the subscription cost.

## 3. The Lifecycle of a Tap (Trust & Low Friction)
When a user taps a notification, the psychological "promise" of the copy must be fulfilled instantly. Broken promises (e.g., tapping a specific alert but landing on a generic home screen) destroy user trust and lower future click-through rates. Celestia's `handleNotificationNavigation` router guarantees context-preservation:

- **Curiosity to Immediate Satisfaction:** A `TRANSIT_ALERT` doesn't just open the app; it passes `scrollToSection: 'transits'`. The user doesn't have to hunt for the information that caught their eye.
- **Direct to Action:** `EVENING_REFLECTION` passes `openJournal: true`. The notification asks a reflective question, and the app immediately presents the blank page. Zero clicks required.
- **Feature Discovery (`PRO_DISCOVERY`):** If the push highlights that the user hasn't used "Synastry" yet, the tap routes them directly to the `Circle` tab. This closes the gap between awareness and adoption.

## 4. Habituation & Frequency Capping
The system employs a sophisticated **Frequency Cap** to protect against notification fatigue and subsequent uninstalls.
- **Progressive Tolerance:** Fresh installs receive a strict cap (e.g., max 1/day) because the habit is fragile. Retained users are allowed a higher cap because they have built tolerance and trust.
- **Bundle Logic:** Users self-select their tolerance during onboarding (`minimal`, `balanced`, `everything`), which acts as a psychological contract. The app honors this contract, ensuring it never feels "spammy."

## 5. The Zeigarnik Effect (Reactivation)
The `LAPSED` cascade (Days 2, 3, 5, 7, 10, 14, 21) avoids needy, desperate copy like "We miss you!"
- Instead, the engine dynamically pulls the user's `lastPartnerName` or `lastChatTitle`.
- It frames the push around an unresolved dynamic. This leverages the **Zeigarnik Effect**—the psychological tendency to remember and fixate on uncompleted or interrupted tasks. By reminding them of an unfinished emotional thread, the app pulls them back in organically.
