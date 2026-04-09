# Pawlo — Play Console Data Safety form answers

> Field: Play Console → App content → Data safety. Each section maps to a
> question Play Console will ask. Use these as the canonical answers; if the
> wording in the form doesn't match exactly, pick the closest option.

---

## 1. Data collection and security (top of form)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (TLS for all client → server traffic) |
| Do you provide a way for users to request that their data be deleted? | **Yes** (in-app "Delete account" button on the Profile screen → calls the `delete_user_account` Supabase RPC, which wipes profile, dog, and all child rows + the auth user) |

---

## 2. Data types collected

For each row, declare:
- **Collected:** Yes
- **Shared:** the partners listed under "Shared with"
- **Optional / Required:** R = required for the app to function, O = optional
- **Purpose:** App functionality, Account management, etc. (Play allows multiple)

### Personal info

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Email address | Yes | Supabase | R | Account management |
| Name | Yes (display name, optional) | Supabase | O | Account management, App functionality |
| User ID (Supabase UUID) | Yes | Supabase, RevenueCat | R | App functionality |

### Financial info

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Purchase history | Yes (subscription state only — no payment details) | RevenueCat | O | App functionality (entitlement check) |

> Card numbers and payment details are handled entirely by Google Play Billing — Pawlo never receives them. Do **not** declare "Credit card or bank account number" because we don't see it.

### Location

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Approximate location | Yes | Supabase | O | App functionality (walk distance) |
| Precise location | Yes | Supabase | O | App functionality (walk route tracking) |

> Location is collected **only while a walk session is active**, in the
> foreground, with the user's explicit tap on "Start walk". Never in the
> background.

### Personal communications

> Pawlo collects in-app chat messages **with the AI character (Pawlo)** —
> Play Console treats this as a "Messages" subcategory. Declare:

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Other in-app messages | Yes (advisor chats) | Supabase, Anthropic (LLM relay) | O | App functionality |

### Audio files

> Voice input is converted to text on the device or via the Apple/Google
> speech-recognition framework. **No raw audio is stored or transmitted** to
> our servers. Do **not** declare "Voice or sound recordings".

### App activity

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| App interactions | Yes (sessions completed, tricks practised, missions, XP, badges, streaks) | Supabase | R | App functionality, Analytics (anonymised aggregate only) |
| In-app search history | No | — | — | — |
| Other user-generated content | Yes (dog profile fields, weight logs, vaccinations, medications, walk notes) | Supabase | O | App functionality |

### App info and performance

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Crash logs | No (no crash reporter wired up at v1) | — | — | — |
| Diagnostics | Yes (app version, OS, locale, sent automatically by Expo at install/update time only) | Expo | R | App functionality |
| Other app performance data | No | — | — | — |

### Device or other IDs

| Data type | Collected | Shared with | Required? | Purpose |
|---|---|---|---|---|
| Device or other IDs | Yes (Expo push token, RevenueCat anonymous app user ID) | Expo, RevenueCat | O | App functionality |

---

## 3. Data usage and handling — extra declarations

- **Is the data collected processed ephemerally?** No — most data is stored persistently because the entire point is to track training progress over time.
- **Is the data collected used for tracking across other companies' apps and websites?** **No.**
- **Do you use this data for advertising?** **No.**
- **Do you use this data for fraud prevention, security, or compliance?** Yes (basic abuse detection on the AI relay endpoint).
- **Is data collected with consent?** Yes — account creation makes the user agree to the privacy policy; location and notification permissions are explicit OS prompts.

---

## 4. Sharing — additional context for the form

For every "shared with" entry above, the recipient acts as a **data
processor** on Pawlo's behalf, not an independent controller. Declare it as
"Data is shared with third parties" rather than "Data is sold". Pawlo never
sells user data.

| Recipient | What they receive | Purpose |
|---|---|---|
| Supabase | All persistent app data (account, dog, training, walks, health) | Database hosting, auth, storage |
| Anthropic | Only the chat messages sent to the Pawlo AI character | LLM responses (does not train on this data per Anthropic's commercial terms) |
| RevenueCat | Anonymous user ID + entitlement state | Subscription management |
| Google Play Billing | Payment details (handled directly by Google) | Process the subscription |
| Expo | Diagnostic + push token | App build distribution and notification delivery |
| Cloudflare | Standard request logs (transient) | Hosts the pawlo.so website |

---

## 5. Privacy policy URL

```
https://pawlo.so/privacy
```

This URL **must be live before submitting the form**. The privacy policy
document lives at `web/privacy.html` in the repo and is deployed via
Cloudflare Pages alongside the landing page.

---

## 6. After submitting

Play Console regenerates the in-store "Data safety" panel within ~24 hours
of approval. Users will see a clean, accurate breakdown of what we collect
and why. If you change anything in the app's data flow later — adding
analytics, adding a new processor, etc. — come back and update this form
**before** shipping that release. Mismatch = policy violation = warning →
removal.
