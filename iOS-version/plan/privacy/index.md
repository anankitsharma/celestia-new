# Celestia — Legal

**Last updated:** [INSERT DATE BEFORE PUBLISHING]

A short index of the legal documents that govern your use of Celestia. All five fit on one screen and explain themselves in plain language. Pick the one you need.

---

## [Privacy Policy](https://celestia.app/privacy)

What we collect, where it lives, what we do with it. The short version: we collect very little, it lives on your device, and we don't sell anything.

## [Terms of Service](https://celestia.app/terms)

The agreement between you and us. Includes the "reflection, not advice" disclaimer, the AI safety expectations, and what counts as acceptable use.

## [End User License Agreement (EULA)](https://celestia.app/eula)

The license that lets you install and use the app. For most users this is covered by Apple's Standard EULA — you only need this page if a custom EULA is published.

## [AI Disclaimer](https://celestia.app/ai-disclaimer)

What the AI inside Celestia does, what it does not do, and how to use its output safely. Worth reading once.

## [Data Deletion](https://celestia.app/delete-data)

Two-tap instructions to delete everything. Required by Apple Guideline 5.1.1(v).

## [Support](https://celestia.app/support)

FAQ, troubleshooting, and how to report AI output that goes wrong.

---

## Quick answers

**Do you have an account for me to log into?**
No. Celestia has no sign-in. There is nothing on a server to log into.

**Do you sell my data?**
No. We never have. We never will.

**Do you collect analytics?**
No. There is no analytics SDK in this version of the app.

**How do I delete my data?**
Open the app → **Profile** → **Reset App Data**. Or delete the app from your device. Both wipe everything.

**Where does my data live?**
On your device, in a local SQLite database (`celestia_v1.db`). Not on our servers.

**Does the app talk to anyone over the internet?**
Yes, two services, anonymously: **Google Gemini** (when you tap to generate AI text) and **OpenStreetMap / Nominatim** (when you type a birth city during onboarding). Neither receives your name or any persistent ID.

**Is the AI giving me advice?**
No. The AI generates **reflective prompts**. It is not a doctor, therapist, lawyer, accountant, or counselor. See the [AI Disclaimer](https://celestia.app/ai-disclaimer) for detail.

**Is astrology a science?**
No. Celestia uses astrology as a structured starting point for written reflection. Whether the reflections feel meaningful is up to you.

**Who can I contact?**
**support@celestia.app**

---

## Editor's notes (delete this entire block before publishing)

### Required substitutions

| Placeholder | Replace with |
|---|---|
| `[INSERT DATE BEFORE PUBLISHING]` | Today's date (ISO `YYYY-MM-DD`) |
| `support@celestia.app` | A real, monitored support inbox |
| `https://celestia.app/...` | The actual hosted URLs |

### Where this URL goes

This page is optional but useful. If you host it at `https://celestia.app/legal`, you can link it from the app's Profile screen as a single entry point ("Legal & Privacy") instead of listing all five documents separately.

The five sub-documents (`/privacy`, `/terms`, `/eula`, `/ai-disclaimer`, `/delete-data`) are the documents Apple actually checks. This index is for humans.
