# Celestia Notification System Architecture

## Core Philosophy
The `Celestia-new` app utilizes a **100% Local Notification Architecture** via `expo-notifications`. There is no remote backend server (like APNs or FCM) actively pushing payloads to the device. Instead, the app acts as its own notification engine, predicting and scheduling future pushes based on the user's current local state, cosmic transits, and behavioral streaks.

- **Engine Location:** `src/services/notificationService.js`
- **Main Trigger:** `scheduleAllNotifications()`
- **Invocation:** It is called dynamically during key app lifecycle events (e.g., cold starts via `App.js`, completing daily tasks, modifying notification preferences, etc.).

## Scheduled Notification Categories
The engine groups future pushes into several distinct categories based on user behavior and astrology timelines:

1. **Daily Core Pushes**
   - `COSMIC_MORNING`: A daily morning read, utilizing AI-generated lines or templated fallbacks based on user settings.
   - `EVENING_REFLECTION`: A daily evening push designed to loop users back into the journal feature.

2. **Astrology & Event Pushes**
   - `TRANSIT_ALERT`: Triggered only when significant cosmic events or transits affect the user's chart.
   - `SOLAR_RETURN`: An annual birthday milestone, scheduled to fire 7 days before the user's birthday to build anticipation.

3. **Engagement & Streak Mechanics**
   - `STREAK_GUARDIAN`: A daily evening protection ping to save an active streak.
   - `STREAK_ANTICIPATION`: Fires the day *before* a milestone (e.g., day 6 before a 7-day streak) to build anticipation (Hook Model).
   - `BADGE_RESCUE`: Fires when a user is 1-2 actions away from earning a badge, pushing them over the finish line.
   - `LAPSED`: A reactivation cascade (days 2, 3, 5, 7, 10, 14, 21) triggering customized win-back hooks if the user goes dormant.
   - `JOURNAL_PATTERN`: Scheduled for Fridays if the app locally detects a recurring theme in the user's journal entries.
   - `WEEKLY_DIGEST`: A standard Sunday overview push.

4. **Monetization & Retention (RevenueCat Hooks)**
   - `PRO_DISCOVERY`: Fires on Days 3 and 7 post-purchase, dynamically surfacing premium features (like Deep Dives or Compatibility) that the user *hasn't tried yet*, combating "not using it enough" churn.
   - `TRIAL_ENDING`: Scheduled to fire 2 days before a free trial converts to a paid charge, using a non-anxious tone to reduce unexpected bill shock and chargebacks.
   - `BILLING_RENEWAL`: A standard renewal reminder for annual subscribers.
   - `SUBSCRIPTION_ENDING`: A soft reactivation nudge for users whose subscriptions are lapsing.

## How Notifications Open (Deep Linking)
When a notification is tapped, the OS wakes the app up and passes the payload to the listeners in `App.js`:

1. **Cold Start (App was completely closed):** 
   - `Notifications.getLastNotificationResponseAsync()` catches the initial launch payload.
2. **Warm Start (App was in background/foreground):** 
   - `Notifications.addNotificationResponseReceivedListener` catches the tap event.

Both listeners extract the `data` object attached to the push (which includes `category` and `params`) and pass it to the deep-linking router: `handleNotificationNavigation(navigationRef, data)`.

## Deep Link Routing (`handleNotificationNavigation`)
The router relies on a `switch (category)` block to send the user to the correct screen.

**Routing Map:**
- `COSMIC_MORNING` -> **Today Tab**
- `EVENING_REFLECTION` -> **Today Tab (Journal open)**
- `TRANSIT_ALERT` -> **Today Tab (Scrolled to transits)**
- `STREAK_GUARDIAN`, `STREAK_ANTICIPATION`, `BADGE_RESCUE`, `LAPSED`, `SOLAR_RETURN`, `JOURNAL_PATTERN` -> **Today Tab**
- `COSMIC_MILESTONE`, `TRIAL_ENDING`, `BILLING_RENEWAL`, `SUBSCRIPTION_ENDING` -> **Profile Tab**
- `WEEKLY_DIGEST` -> **Today Tab (Weekly view)**
- `PRO_DISCOVERY` -> Dynamically routes to **Reports**, **Circle**, or **Today** depending on which Pro feature is being highlighted (`params.tab`).

*(Note: Prior to this analysis, several of the newly added categories like `PRO_DISCOVERY` and `TRIAL_ENDING` were missing from the routing switch block, which caused them to fall back to the Today screen instead of their intended screens. This has now been corrected in the codebase).*
