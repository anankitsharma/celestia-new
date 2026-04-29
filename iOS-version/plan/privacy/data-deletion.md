# Data Deletion

**Last updated:** [INSERT DATE BEFORE PUBLISHING]

---

> **Apple Guideline 5.1.1(v)** requires every app that collects user data to make data deletion clear and accessible.
>
> Celestia stores your data **on your device**, not on a server we operate. There is no Celestia account to delete because there is no Celestia account to begin with. You can delete everything in **two taps**.

---

## The fastest way: Reset App Data

1. Open Celestia.
2. Tap the **Profile** tab.
3. Scroll to the bottom and tap **Reset App Data**.
4. Confirm.

This action:

- Deletes the local SQLite database (`celestia_v1.db`).
- Clears AsyncStorage (preferences, counters, cached lookups).
- Removes every Connection (every person you have added).
- Removes every journal entry.
- Removes every chat message.
- Removes every report you have generated.

The action is **immediate** and **irreversible**. There is no recycle bin and no backup — because nothing was ever stored on a server we operate.

## The other way: delete the app

If you would rather not open the app, simply delete it from your device:

1. Long-press the Celestia icon on your home screen.
2. Tap **Remove App** → **Delete App** → **Delete**.

When iOS deletes the app, it also deletes the app's local SQLite database, AsyncStorage, and any cached files. Nothing remains on the device, and nothing was ever sent to us.

## What about data that was sent to third parties?

Celestia talks to two third-party services. Neither receives your name or any persistent identifier — your requests are anonymous to them.

### Google Gemini (AI text)

When you generated a reading, sent a chat message, or generated a report, the request was processed by Google's Gemini API. Google's retention is governed by [Google's Gemini API Terms](https://ai.google.dev/gemini-api/terms). At the time of this writing, paid Gemini API content is not used to train Google's models.

If you wish to exercise data-subject rights with Google directly, contact Google: <https://policies.google.com/privacy>.

### Nominatim / OpenStreetMap (city lookup)

When you typed a birth city, the partial city string was sent to OpenStreetMap's free Nominatim geocoding service. Their retention policy is at <https://operations.osmfoundation.org/policies/nominatim/>.

These requests are anonymous and contain only the partial city string — there is nothing identifying you to delete.

## What we do not have

We do **not** have:

- Your email or contact information (we did not ask for it).
- Your real name (we asked only for a first name or nickname).
- Your account (there is no account system).
- Your billing information (the app has no in-app purchases in this version).
- Your device identifier (we do not collect IDFA).
- A copy of your journal entries, chats, or Connections (these never left your device).

Because we do not have these, there is no Celestia-side deletion to perform. Reset App Data — or deleting the app — is the complete deletion path.

## If you can't open the app

If your device is broken, lost, or the app crashes before you can reach Profile → Reset App Data, please email **support@celestia.app** and we will help you walk through it on a fresh install. Because we do not store your data, we cannot delete data we do not have — but we can help you understand what's on the device and how to wipe it.

## Right-to-erasure under regional law

If you are an EU/EEA/UK resident (GDPR/UK GDPR), a California resident (CCPA/CPRA), an Indian resident (DPDP), a Brazilian resident (LGPD), or a resident of another jurisdiction with similar law, you have a right to erasure of your personal data.

For Celestia, the practical answer is the same as above:

- **Your data is on your device.** Use Reset App Data, or delete the app.
- **No server-side erasure is required of us** because we do not maintain a server-side copy.

If you would like written confirmation of this for your records, email **support@celestia.app** and we will reply within 30 days.

## Contact

Questions about deletion or your data:

**support@celestia.app**

---

## Editor's notes (delete this entire block before publishing)

### Required substitutions

| Placeholder | Replace with |
|---|---|
| `[INSERT DATE BEFORE PUBLISHING]` | Today's date (ISO `YYYY-MM-DD`) |
| `support@celestia.app` | A real, monitored support inbox |

### Where this URL goes

App Store Connect → My Apps → Celestia → **App Privacy** → **Account Deletion** → paste this page's URL.

If App Store Connect's UI for Account Deletion doesn't appear (some apps don't trigger the field), the same URL can be linked from the app's Profile screen ("Learn more about deletion") and from the Privacy Policy itself.

### Why this page exists separately from the Privacy Policy

Apple's reviewer dashboard often surfaces a dedicated Account Deletion field. Having a single-page, jargon-free explanation at a stable URL makes it trivial for the reviewer to verify the requirement is satisfied. It also reduces friction for any user who wants to confirm they can delete their data before installing.

### Keep this page short

This is the one privacy document a real user might read. Two-tap instructions, then a short FAQ, is the ceiling. Don't bloat it.
