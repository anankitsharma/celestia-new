# App Privacy / Privacy Nutrition Label — paste-ready answers

**Where this goes:** App Store Connect → Celestia → App Privacy → Get Started (or Edit). Fill the questionnaire screen-by-screen using the answers below.

**Apple's "Collected" definition (verbatim):**
> Data is collected when it is transmitted off the device in a way that allows the developer and/or its third-party partners to access it for a period longer than necessary to service the transmitted request in real time.

So: data that **stays in local SQLite / AsyncStorage on the device is NOT Collected** even though the user enters it. Only data that crosses the network counts.

---

## Step 1 — Select data types collected

On the screen titled *"Select all of the data types that you or your third-party partners collect from this app"*, check **only** these 3 boxes. Leave everything else **unchecked**.

### ☑️ Location → **Coarse Location**

**Why we collect this:** When the user types a birth city during onboarding, the app sends the city string to OpenStreetMap's Nominatim geocoder to convert it into latitude/longitude. The lat/long is stored locally and used for chart calculation. The city string crosses the network → counts as Collected.

### ☑️ User Content → **Other User Content**

**Why we collect this:** When the user sends a message to the in-app AI advisor or generates a report, the message text + relevant context is sent to Google's Gemini API to produce a reply. The text crosses the network → counts as Collected. Journal entries and partner profiles that *only* live in local SQLite are NOT included here — only the AI-bound user content is.

### ☑️ Other Data → **Other Data Types**

**Why we collect this:** The user's birth date, birth time, and (for partner profiles) the partner's birth data are sent to Google's Gemini API as context for personalized responses. This is data not covered by any other category.

---

## Step 2 — Do NOT select these (verified absent in v1.1.0)

| Category | Reason it's not selected |
|---|---|
| Contact Info → Name | The user enters their name at onboarding but it stays in local SQLite. Description claim *"sent without your name"* — verified not transmitted. |
| Contact Info → Email Address | No sign-up flow in v1.1.0; Supabase auth path is dormant. |
| Contact Info → Phone Number | Not collected. |
| Contact Info → Physical Address | Not collected. The birth *city* is collected as Coarse Location, not as Physical Address. |
| Contact Info → Other User Contact Info | Not collected. |
| Health & Fitness → Health | No HealthKit usage. |
| Health & Fitness → Fitness | No Motion / Fitness API usage. |
| Financial Info → Payment Info | RevenueCat is stubbed; no purchase flow ships in v1.1.0. |
| Financial Info → Credit Info | Not collected. |
| Financial Info → Other Financial Info | Not collected. |
| Location → Precise Location | No GPS; no `expo-location` runtime calls. |
| Sensitive Info | Not specifically collected as a category. Free-text user-supplied content goes under Other User Content above. |
| Contacts | No `expo-contacts` usage. |
| User Content → Emails or Text Messages | Not collected. |
| User Content → Photos or Videos | Not collected. |
| User Content → Audio Data | Not collected. |
| User Content → Gameplay Content | Not applicable. |
| User Content → Customer Support | Support is via email outside the app — not collected in-app. |
| Browsing History | Not collected. |
| Search History | No in-app search. |
| Identifiers → User ID | Random UUID is generated locally for partition keys but is **not** sent to Gemini, RevenueCat (stubbed), or any analytics SDK. Stays on device. |
| Identifiers → Device ID | No advertising identifier read; no tracking SDK. |
| Purchases | No real purchases occur in v1.1.0 (RevenueCat stubbed). |
| Usage Data → Product Interaction | No analytics SDK. App tracks streaks / drift on-device only. |
| Usage Data → Advertising Data | No ads. |
| Usage Data → Other Usage Data | Not collected off-device. |
| Diagnostics → Crash Data | No Sentry, no Crashlytics, no Firebase. |
| Diagnostics → Performance Data | None of the above; no Datadog RUM, no PostHog (removed in v1). |
| Diagnostics → Other Diagnostic Data | Not collected. |
| Surroundings → Environment Scanning | Not applicable (no AR). |
| Body → Hands / Head | Not applicable (no visionOS / AR). |

---

## Step 3 — Per-data-type answers (the follow-up screens)

For each of the 3 selected boxes, App Store Connect will ask 4 questions. Answer exactly as below.

### A. Coarse Location

| Question | Answer |
|---|---|
| Is this data linked to the user's identity? | **No** — the city string sent to Nominatim is not accompanied by any user identifier; Nominatim has no idea which Celestia user is asking. |
| Is this data used to track the user? | **No** — Nominatim does not link this query with other third-party data about the user. |
| What are all the purposes for which this data is collected? | Check **App Functionality** only. Do NOT check Analytics, Personalization (Apple's "Personalization" means non-essential personalization, not core feature behavior), Marketing, or Third-Party Advertising. |

### B. Other User Content

| Question | Answer |
|---|---|
| Is this data linked to the user's identity? | **No** — chat messages and report inputs are sent to Gemini without the user's name, email, or any account ID. |
| Is this data used to track the user? | **No** — not combined with other third-party data, not shared with data brokers. |
| What are all the purposes for which this data is collected? | Check **App Functionality**. |

### C. Other Data Types

| Question | Answer |
|---|---|
| Is this data linked to the user's identity? | **No** — birth data is sent to Gemini without name/email/account ID. |
| Is this data used to track the user? | **No**. |
| What are all the purposes for which this data is collected? | Check **App Functionality**. |
| (ASC will ask you to describe "Other Data Types" in a free-text field) | Type: `Birth date, birth time, and birth location for the user and any partner profiles the user adds. Used as context for AI-generated personalized responses.` |

---

## Step 4 — "Tracking" question (Apple's overall question)

ASC will ask separately: *"Do you or your third-party partners use data for tracking purposes?"*

Answer: **No**.

Justification: We do not link any user data with third-party data for advertising / advertising measurement, and we do not share data with data brokers. Apple's definition of *tracking* is specifically the linking-with-third-party-ad-data case — not the mere use of any third party.

This means the resulting nutrition label will show **"Data Not Linked to You"** in the public listing, with the 3 categories above. Cleanest possible nutrition label given the app's actual behavior.

---

## Step 5 — Final review before publishing

- [ ] Exactly 3 boxes checked: Coarse Location, Other User Content, Other Data Types.
- [ ] Every selected box answered: Linked = No, Tracking = No, Purpose = App Functionality.
- [ ] "Other Data Types" free-text description written.
- [ ] Overall tracking question = No.
- [ ] Privacy Policy URL set in the same App Privacy section (the URL hosts the longer-form disclosure).

Click **Save** and then **Publish** at the top of the App Privacy page. The new label takes effect with the next version's review approval.

---

## If a reviewer pushes back on any answer

The most likely follow-up question from App Review is: *"Why isn't User ID disclosed if the app generates one?"*

**Reply (paste verbatim into App Review Notes if asked):**
> The app generates a random UUID locally to partition data within the device's SQLite database (e.g., to associate journal entries with the user's profile row). This UUID never leaves the device — it is not sent to Google's Gemini API, RevenueCat, our servers, or any analytics service. Per Apple's definition of Collected ("transmitted off the device"), it does not qualify as a Collected data type and is therefore not disclosed in the privacy nutrition label.

If they push back on the AI-bound content claim, point to the same paragraph in the public Description: *"AI answers are generated by Google's Gemini service — sent without your name or any account ID, and never stored on our servers."*
