# Support for Celestia

Need help understanding your patterns or making the app work for you? We're here.

---

## Direct support

The fastest way to reach us is by email. Bug reports, feature requests, AI-output reports, deletion questions — drop us a message and we'll reply within 24–48 hours.

**Email: nandinipalakodeti0@gmail.com**

When you write in, please include:

- Your iPhone model and iOS version (e.g. *iPhone 14 Pro · iOS 18.4*).
- A short description of what you were doing when the issue happened.
- A screenshot or screen recording if you have one.

Please **do not** send your birth chart or any sensitive personal data in a support email — we don't need it to help you, and email isn't an encrypted channel.

---

## Frequently Asked Questions

### Where is my data stored?

**On your device only.** Celestia uses an on-device SQLite database (`celestia_v1.db`) and the iOS-managed AsyncStorage. Nothing about you, your journal, your Connections, or your chats lives on a Celestia server — because we don't run user-data servers. Full detail is in the [Privacy Policy](https://celestia.app/privacy).

### Do I need an account?

**No.** There is no sign-in, no email, no password. You open the app and use it. The trade-off is that there's no cross-device sync — if you delete the app or change phones, your data does not follow you.

### Is Celestia free?

**Yes, the current version is free.** There are no in-app purchases, no subscriptions, no ads, and no upgrade path. If that changes in a future version, the change will be obvious — there will be a clear paywall, and we'll never charge you without consent.

### Is the AI giving me advice?

**No.** The AI in the "Ask" tab and the daily readings is built to generate **reflective prompts**, not advice. It does not know you, does not have a license, and is not a substitute for a doctor, therapist, lawyer, or accountant. See the [AI Disclaimer](https://celestia.app/ai-disclaimer) for the full picture, and **always talk to a qualified professional for real questions**.

If you are in crisis, please contact a human on a crisis line. In the U.S.: **988** (Suicide & Crisis Lifeline), text **HOME** to **741741** (Crisis Text Line), or call **1-800-799-7233** (Domestic Violence Hotline).

### Is astrology a science?

**No.** Celestia uses astrology as a structured prompt — it gives the AI a starting frame that gets translated into reflective text. We make no claim that astrology predicts the future or describes objective reality. Whether the reflections feel meaningful is up to you.

### Why does the app ask me to confirm before I add someone to Connections?

Because adding another person to your Connections means storing their birth details on your device. That should only happen with their knowledge and consent. The confirmation is there to remind you of that — please respect it. If a person you've added asks you to remove them, please open Connections, tap the person, and remove them.

### How do I delete my data?

**Two taps:** Profile → Reset App Data → Confirm. That wipes the local database and everything in it — Connections, journals, chats, reports, preferences. Or, delete the app from your home screen and iOS removes everything.

There is **no recycle bin and no backup** — because nothing was ever uploaded to a server. Deletion is final and immediate. Full detail is on the [Data Deletion](https://celestia.app/delete-data) page.

### Why does the app feel slow on the first launch after install?

The first time you open the app, it builds your full chart from your birth data. The second launch onward is much faster because the chart is cached locally. If a specific screen still feels slow on subsequent launches, please email us with the screen name.

---

## Troubleshooting

### The AI ("Ask" tab) isn't responding.

The AI feature talks to Google's Gemini API. If it's silent:

1. Check your internet connection (Wi-Fi or cellular).
2. Pull-to-refresh the chat thread (drag the messages list down).
3. Force-quit Celestia (swipe up from the home indicator and flick the Celestia card up) and reopen.
4. If the problem persists for more than an hour, it may be a Gemini service incident — try again later, or [check Google's status page](https://status.cloud.google.com/).

If you typed a phrase that the app considered a possible crisis signal, the AI is intentionally paused and a resource list is shown instead. That is by design — please reach the human resources listed.

### Birth-city autocomplete won't load.

City suggestions come from OpenStreetMap's Nominatim service. If suggestions don't appear:

1. Check your internet connection.
2. Try typing 3 or more characters of the city name in English (e.g. "Mum" → "Mumbai").
3. If a tiny city isn't found, type the nearest large city instead — the chart math is robust to a few kilometres.
4. You can also tap **"Skip for now"** during onboarding and add the birth city later from Profile.

### Notifications aren't showing up.

Notifications in Celestia are scheduled locally on your device, not sent from a server.

1. Open the iOS **Settings** app → **Notifications** → **Celestia** → ensure **Allow Notifications** is on.
2. Inside Celestia, open **Profile** → **Notification Settings** and confirm the daily reminder is enabled.
3. If your phone is in **Focus / Do Not Disturb**, scheduled notifications may be silenced — check your active Focus.
4. The first scheduled reminder may take up to 24 hours to fire (it waits for the next chosen time-of-day).

### The app crashes or won't open.

1. Force-quit Celestia and reopen.
2. Restart the iPhone.
3. If the app still won't open, **delete and reinstall** it. **Important:** because all data is local, deleting the app erases your data — there is no cloud backup. Reinstall and re-onboard.
4. If reinstalling doesn't help, please email us with your iOS version and iPhone model.

### I want to start over without deleting the app.

Open **Profile** → scroll to the bottom → **Reset App Data** → Confirm. The app returns to its first-launch state and you can re-onboard.

### I added a Connection and now it's showing the wrong compatibility result.

Two common causes:

1. **Birth time was skipped.** Several dimensions of compatibility (especially Emotional and Daily-Life) depend on birth time. Without it, those dimensions fall back to the noon estimate, which is approximate. If you can ask the person for their birth time, edit the Connection and add it.
2. **Birth city is too generic.** If you typed only a country, the latitude/longitude defaults to the country centroid, which can shift houses significantly. Edit the Connection and pick a specific city.

After editing, the compatibility detail page recalculates automatically.

### My journal entries are missing.

Journal entries are stored on-device only. They cannot disappear unless:

1. You used **Reset App Data** in Profile.
2. You deleted and reinstalled the app.
3. The device was restored from a backup that was made *before* the entries were written.

If none of these apply and entries are still missing, please email us with the dates of the missing entries and your iOS version — we'll try to help diagnose, although we cannot recover data we never had.

---

## Reporting AI output

If the AI says something inaccurate, biased, harmful, or inappropriate, please report it:

- **In the app:** tap the small **"Send to team"** link beneath the offending message.
- **Or email** nandinipalakodeti0@gmail.com with a description of the issue and (if possible) the message text.

We read every report and adjust the prompts and safety wrappers when we learn something new.

---

## Privacy and deletion

- [Privacy Policy](https://celestia.app/privacy)
- [Terms of Service](https://celestia.app/terms)
- [AI Disclaimer](https://celestia.app/ai-disclaimer)
- [Data Deletion](https://celestia.app/delete-data)

---

© 2026 Celestia · Operated by P Nandini. All rights reserved.
