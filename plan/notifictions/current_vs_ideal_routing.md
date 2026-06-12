# Notification Routing: Current State vs. Ideal Architecture

This document maps every notification category in Celestia, detailing what it currently does, where it routes the user, and what the **ideal** experience should be to maximize engagement, delight, and lower friction.

---

## 1. Daily Habit Hooks

### `COSMIC_MORNING` (Daily Read)
- **What it is:** Morning personalized push based on transits or templates.
- **Current Path:** `Main -> Today` (Passes `highlightLifeArea`).
- **Ideal Path:** Perfect as is. The Today screen is the anchor for the daily read. 

### `EVENING_REFLECTION` (Journal Prompt)
- **What it is:** Nightly check-in prompting the user to write.
- **Current Path:** `Main -> Today` (Passes `openJournal: true`).
- **Ideal Path:** Excellent. The fact that it bypasses the home screen and immediately opens the blank canvas reduces friction to zero.

---

## 2. Retention & Streaks

### `STREAK_GUARDIAN` & `STREAK_ANTICIPATION`
- **What it is:** Pushes to protect a streak or build anticipation for a milestone (e.g., Day 6 before Day 7).
- **Current Path:** `Main -> Today`.
- **Ideal Path:** While Today is okay, ideally the app should detect `params.streak` and immediately trigger a **confetti or milestone animation overlay** upon opening. The user is coming for the dopamine hit of the streak; we should celebrate it the second the app opens.

### `BADGE_RESCUE`
- **What it is:** "You are 1 action away from earning [Badge Name]."
- **Current Path:** `Main -> Today`.
- **Ideal Path:** Instead of just dropping them on the Today screen, this should ideally route to the **Profile Tab** and automatically scroll to or highlight the specific badge that is almost unlocked. The visual gap (the empty badge slot) will drive the completion behavior.

### `LAPSED` (Reactivation)
- **What it is:** The 2, 3, 5, 7+ day cascade to win back dormant users. Often uses context like a partner's name or a chat thread.
- **Current Path:** `Main -> Today`.
- **Ideal Path:** If the lapsed push copy references a specific partner (e.g., *"There is an unresolved dynamic with Sarah"*), tapping it should **route directly to the Match/Compatibility screen for Sarah** or directly into the **Chat thread**. Dropping them on the Today tab breaks the contextual promise of the notification.

---

## 3. Deep Astrology Hooks

### `TRANSIT_ALERT`
- **What it is:** High-priority cosmic shifts affecting the user.
- **Current Path:** `Main -> Today` (Passes `scrollToSection: 'transits'`).
- **Ideal Path:** Perfect. Reduces the cognitive load of hunting for the transit.

### `SOLAR_RETURN`
- **What it is:** 7 days before the user's birthday.
- **Current Path:** `Main -> Today`.
- **Ideal Path:** Birthdays are the highest emotional resonance event in astrology. This should ideally route to a **special "Year Ahead" modal** or a dedicated Solar Return report view, rather than blending in with the standard daily view.

### `JOURNAL_PATTERN`
- **What it is:** "You wrote about [Theme] 3 times this week."
- **Current Path:** `Main -> Today`.
- **Ideal Path:** It should route directly to the **Journal history screen**, ideally with a filter applied showing those exact 3 entries. The user wants to see the proof of the pattern we just pointed out.

---

## 4. Monetization & Subscription (Pro)

### `PRO_DISCOVERY`
- **What it is:** Pushes untried premium features on Days 3 and 7.
- **Current Path:** `Reports` | `Circle` | `Today` (Dynamically routed based on feature).
- **Ideal Path:** Excellent. Taking them directly to the feature (e.g., Circle for Synastry) closes the gap between awareness and adoption.

### `TRIAL_ENDING` / `BILLING_RENEWAL` / `SUBSCRIPTION_ENDING`
- **What it is:** Transparent billing lifecycle notifications to prevent chargebacks.
- **Current Path:** `Profile` Tab.
- **Ideal Path:** While the Profile tab is where settings live, it still requires the user to find the "Manage Subscription" button. Ideally, these should route **directly to the Subscription Management Modal/Screen**. If a user is tapping "Your trial ends tomorrow," forcing them to hunt for the cancel button creates hostility. Direct routing builds immense brand trust.

---

## Summary of Ideal Engineering Tasks (Phase 2)
To move from the current state to the ideal state, the following deep-link handlers should be expanded in `handleNotificationNavigation` and `AppNavigator`:
1. **Lapsed Deep-Linking:** Add `partnerId` or `chatId` to lapsed notification payloads, and handle them by routing to `Match` or `Chat`.
2. **Badge Highlighting:** Add a param to `BADGE_RESCUE` to scroll the Profile view to the specific badge.
3. **Billing Direct-Routing:** Create a direct deep link to the Subscription Modal for trial/billing alerts.
4. **Journal Pattern Filtering:** Enable the Journal screen to accept a `themeFilter` parameter and route `JOURNAL_PATTERN` there.
