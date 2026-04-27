# 06 — App Store Connect Setup (field-by-field)

This is what to enter into every field in App Store Connect for the resubmission. Fill in this order — fields with `*` are required to submit.

---

## App Information

| Field | Value |
|---|---|
| **Name*** | `Celestia: Relationship Compass` |
| **Subtitle*** | `Understand the people you love` |
| **Bundle ID*** | `com.celestia.app` (existing — don't create a new one) |
| **SKU*** | `celestia-ios-001` (or your existing SKU; arbitrary) |
| **Primary Language*** | English (U.S.) |
| **Privacy Policy URL*** | `https://celestia.app/privacy` ← must resolve before submit |
| **License Agreement** | Apple's Standard EULA (or upload your `05-terms-of-service.md` text) |
| **Category — Primary*** | Lifestyle |
| **Category — Secondary** | Reference |
| **Content Rights** | "Does not contain, show, or access third-party content" |

---

## Pricing & Availability

| Field | Value |
|---|---|
| **Price*** | Free (Tier 0) |
| **Availability*** | All Territories |
| **Pre-Order** | Off |
| **Volume Purchase Program** | Off |

---

## App Privacy (Privacy Nutrition Label)

This is filled out under "App Privacy" in the sidebar. Apple's modal asks if you collect data → **YES**, then asks per category. Reference the matrix below.

### Data NOT collected
Mark these as not collected:
- Health & Fitness
- Financial Info
- Contact Info → Name (we DO ask for first name in onboarding — flag YES; see below)
- Contact Info → Email Address
- Contact Info → Phone Number
- Contact Info → Physical Address
- Contact Info → Other User Contact Info
- Sensitive Info (race, religion, etc.)
- Contacts (the OS contacts list)
- User Content → Photos, Videos, Audio
- User Content → Gameplay Content
- User Content → Customer Support
- Browsing History
- Search History
- Identifiers → Advertising Data (NO — IDFA not used)
- Identifiers → Device ID (NO unless PostHog kept and IDFA on)
- Purchases
- Other Data → Other Financial Info
- Other Data → Sensor Data

### Data that IS collected (be precise)

#### 1. Contact Info → Name
- **Collected:** YES — first name, entered during onboarding
- **Linked to user identity:** NO (we have no account system)
- **Used for tracking:** NO
- **Purposes:** App Functionality (used in greeting and personalization)

#### 2. Location → Coarse Location
- **Collected:** YES — birth city via Nominatim during onboarding
- **Linked to user identity:** NO
- **Used for tracking:** NO
- **Purposes:** App Functionality (chart calculation)

#### 3. User Content → Other User Content
- **Collected:** YES — birth-chart data, journal entries, partner profiles (stored locally in SQLite)
- **Linked to user identity:** NO
- **Used for tracking:** NO
- **Purposes:** App Functionality

#### 4. Identifiers → User ID
- **Collected:** YES — random local UUID generated for the local profile
- **Linked to user identity:** NO
- **Used for tracking:** NO
- **Purposes:** App Functionality

#### 5. Other Data Types
- **Collected:** YES — birth date / time / city for people the user adds (Other Users' Data)
- **Linked to user identity:** NO
- **Used for tracking:** NO
- **Purposes:** App Functionality

#### 6. (Only if PostHog is kept) Diagnostics → Crash Data, Performance Data
- **Collected:** YES
- **Linked to user identity:** NO
- **Used for tracking:** NO
- **Purposes:** Analytics, Product Personalization

If PostHog is removed for v1 (recommended), skip #6 entirely.

---

## Age Rating

Click "Edit" next to Age Rating. Answer:

| Question | Answer |
|---|---|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Sexual Content or Nudity | Infrequent / Mild |
| Graphic Sexual Content or Nudity | None |
| Alcohol, Tobacco, Drug Use or References | None |
| Mature/Suggestive Themes | Frequent / Intense |
| Simulated Gambling | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Unrestricted Web Access | None |
| Gambling and Contests | None |

Final rating produced: **17+**

---

## Version Information (per-version, this is the resubmit)

| Field | Value |
|---|---|
| **Version Number*** | `1.1.0` (must be > 1.0.6) |
| **Copyright** | `© 2026 [YOUR LEGAL ENTITY]` |
| **Promotional Text** | (paste from `02-listing-copy.md` §3) |
| **Description*** | (paste from `02-listing-copy.md` §4) |
| **Keywords*** | `relationship,compatibility,couples,family,friendship,communication,connection,synastry,attachment,empathy` |
| **Support URL*** | `https://celestia.app/support` (or `mailto:support@celestia.app`) |
| **Marketing URL** | `https://celestia.app` |
| **What's New in This Version** | (paste from `02-listing-copy.md` §6) |

---

## App Screenshots

Per `03-screenshot-spec.md`. Upload exactly **6 screenshots** at **1290 × 2796 px** to the **6.7" Display** slot.

Do NOT fill in the iPad slot — we are disabling iPad support in `app.json`.

If App Store Connect insists on iPad screenshots: revisit `app.json` and confirm `ios.supportsTablet: false`. After re-uploading the binary with that flag set, the iPad slot will become optional.

---

## App Preview (video) — optional

Skip for v1. App previews are optional. Adding one is a v2 polish.

---

## App Review Information

| Field | Value |
|---|---|
| **Sign-in Required** | No |
| **Demo Account** | (leave blank) |
| **Notes** | (paste the reviewer note from `02-listing-copy.md` §13) |
| **Contact First Name** | (your first name) |
| **Contact Last Name** | (your last name) |
| **Contact Phone Number** | (your phone — required, never called unless emergency) |
| **Contact Email Address** | (your email — Apple uses this for follow-up) |

---

## Build

After your EAS production build finishes:

1. EAS will upload the build to App Store Connect automatically (if you have the right credentials configured)
2. Or, download the `.ipa` from EAS dashboard and upload via **Transporter** (Mac App Store)
3. The build appears under **TestFlight → iOS Builds** within ~10–30 minutes after Apple's processing completes
4. Once processed, attach to **Version 1.1.0** under **App Store** → **iOS App** → **Build** → **Select a Build**
5. Confirm the build's encryption export-compliance question:
   - "Does your app use encryption?" → **No** (because we set `ITSAppUsesNonExemptEncryption: false` in `app.json`)

---

## Final Submit Checklist (App Store Connect side)

Before clicking **"Add for Review"** then **"Submit for Review"**:

- [ ] Name is `Celestia: Relationship Compass`
- [ ] Subtitle is `Understand the people you love`
- [ ] Description has 0 instances of "horoscope" / "fortune" / "tarot" / "zodiac"
- [ ] Keywords contain `relationship` and exclude `astrology`/`horoscope`
- [ ] Privacy Policy URL resolves (200 OK, returns text)
- [ ] Support URL resolves
- [ ] All 6 screenshots uploaded at 1290 × 2796 px
- [ ] Screenshot 1 leads with **Circle** (not Today)
- [ ] Age rating is 17+
- [ ] App Privacy nutrition label answered for all collected categories
- [ ] App Review Information notes are present (the reviewer note)
- [ ] Build attached
- [ ] Encryption question = No
- [ ] iPad slot is empty (or `supportsTablet: false` in binary makes it not required)
- [ ] Contact email is monitored
- [ ] Pricing = Free (Tier 0)
- [ ] Availability = All Territories
- [ ] Category = Lifestyle
- [ ] Version Number = 1.1.0 (or higher than 1.0.6)

---

## What happens after Submit

1. Apple status changes to **"Waiting for Review"** within minutes
2. Review typically begins within 24–48 hours
3. Review typically completes within 24–48 hours after that
4. Possible outcomes:
   - **Approved** → app goes live (manual release recommended; see below)
   - **Rejected** → message in Resolution Center; refer to `09-risk-register.md` for response playbook
   - **Metadata Rejected** → fix listing copy and resubmit; doesn't require new build

For initial submission, set the release behavior to **"Manually release this version"** so you can review the live App Store entry before it's public.

---

## After Approval — release sequence

1. App Store Connect → My Apps → Celestia → version 1.1.0 → "Release this Version"
2. Within ~30 minutes the app appears on the App Store
3. Verify on a real device:
   - Open the App Store
   - Search for "Celestia Relationship"
   - Confirm screenshots, description, age rating, privacy
4. Smoke-test the live app:
   - Download fresh
   - Walk through onboarding
   - Try Circle, Ask, Reports
   - Confirm no crashes
