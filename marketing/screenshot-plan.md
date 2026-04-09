# Pawlo — Play Store screenshot capture plan

Google Play allows 2-8 phone screenshots. We need at least 4 to look credible.
Below is the recommended set, in order, with the demo state for each shot.

**Resolution target:** 1080 × 2400 (Pixel 6/7/8) or 1284 × 2778 (iPhone 13/14/15
Pro Max). Either works as long as the long edge is ≥1920px and the aspect ratio
is between 9:16 and 9:18.5. Capture from a real device or the Android emulator
(Pixel 6 Pro AVD recommended).

---

## Recommended demo state

Before you start capturing, set up a clean demo account so the numbers and
streaks look like a real user has been active for a while:

| Field | Value |
|---|---|
| Dog name | **Roi** |
| Breed | Maltichon |
| Age | 1 year |
| Weight | 4.2 kg |
| Level | **3 — Good Boy/Girl** (≥500 XP) |
| Streak | **7 days** (looks intentional, not lucky) |
| Active programs | Loose-Leash Walking + Recall Training |
| Tricks unlocked | 6 (Sit, Down, Paw, Spin, Wait, Touch) |
| Walks | 3 logged with realistic routes |
| Health | 1 weight log, 1 vaccination |

To set this up:

1. Create a fresh account: `pawlo-demo@pawlo.so`
2. Run onboarding, name the dog **Roi**.
3. In dev mode (`__DEV__`), use the dev panel to set XP to 700 and streak to 7.
4. Complete a session in 2 of the 4 programs so the dashboard cards show
   active progress.
5. Complete 6 tricks (tap them in the trick library).
6. Record 3 short walks (they don't need to be real walks — let the GPS sit
   for 30 seconds and stop).

---

## Shot list

Capture in this order. Filenames are suggestions for organising in `ss/`.

### Shot 1 — Hero / Dashboard
**Filename:** `01-dashboard.png`
**Screen:** Dashboard (after login)
**State:** Roi card visible at top, level 3, 7-day streak with the fire
emoji, today's missions visible, "Continue training" CTA in gold.
**Why:** First impression. Sells the gamification + warm dark UI.
**Optional overlay text:** _"Your dog's personal teacher."_

### Shot 2 — Training session
**Filename:** `02-session.png`
**Screen:** Active training session (e.g. Loose-Leash step 3)
**State:** Mid-session. Step description visible. Step countdown timer
(introduced in commit 377f54d) running. Floating clicker widget visible.
**Why:** Shows the actual training experience.
**Optional overlay text:** _"5 minutes a day. Real progress."_

### Shot 3 — Pawlo AI advisor
**Filename:** `03-advisor.png`
**Screen:** Advisor chat
**State:** A short conversation: user has asked _"Roi keeps pulling on the
leash, what should I do?"_ and Pawlo has replied with a kind, structured
3-step answer.
**Why:** AI is the differentiator. Shows the personality.
**Optional overlay text:** _"Ask Pawlo anything. Anytime."_

### Shot 4 — Trick library
**Filename:** `04-tricks.png`
**Screen:** Tricks
**State:** 6 unlocked, 6 locked behind Pro. Categories filter visible.
**Why:** Shows breadth of content + the freemium model honestly.
**Optional overlay text:** _"From Sit to Spin. 12 tricks. One library."_

### Shot 5 — Levels & badges
**Filename:** `05-badges.png`
**Screen:** Badges
**State:** 4-5 earned badges visible (First Session, 7-Day Streak, First
Walk, Tricks Master, etc.)
**Why:** Pure dopamine. Sells the "duolingo feeling".
**Optional overlay text:** _"Train. Earn. Repeat."_

### Shot 6 — Walks
**Filename:** `06-walks.png`
**Screen:** Walks list
**State:** 3 recent walks. Each card shows distance, duration, route
preview. (On Android the MapViewSafe placeholder will show — that's OK,
it looks intentional with the "Map preview · GPS tracking still active"
copy.)
**Why:** Shows breadth — Pawlo isn't just training, it's the whole life.
**Optional overlay text:** _"Walk together. Track everything."_

### Shot 7 (optional) — Calendar
**Filename:** `07-calendar.png`
**Screen:** Calendar
**State:** A month view with at least 12 days of activity dots: training
sessions in gold, walks in purple, tricks in green.
**Why:** Reinforces the "daily ritual" angle.
**Optional overlay text:** _"Every day counts."_

### Shot 8 (optional) — Paywall
**Filename:** `08-paywall.png`
**Screen:** Paywall (Pawlo Pro)
**State:** Hero with crown, comparison table, £4.99/mo button.
**Why:** Subscription transparency. Builds trust before purchase.
**Optional overlay text:** _"Unleash Pawlo's full powers."_

---

## Capture method

**Android emulator (recommended):**

```sh
# In the emulator's extended controls (... button):
# Settings → Advanced → Screenshot save location: ~/Desktop/pawquest/ss
# Then use Cmd+S in the emulator to capture.
```

Or, from the command line:

```sh
adb -s emulator-5554 shell screencap -p /sdcard/shot.png
adb -s emulator-5554 pull /sdcard/shot.png ~/Desktop/pawquest/ss/01-dashboard.png
adb -s emulator-5554 shell rm /sdcard/shot.png
```

**Real Android device:**

```sh
# Connect via USB, enable USB debugging.
adb devices
adb -s <DEVICE_ID> shell screencap -p /sdcard/shot.png
adb -s <DEVICE_ID> pull /sdcard/shot.png ~/Desktop/pawquest/ss/01-dashboard.png
```

---

## After capturing

1. Drop all screenshots into `ss/` (already gitignored — feel free to add
   `ss/.gitkeep` if you want to track the folder).
2. Review for any leaked email/UID/internal info — blur or retake.
3. (Optional) Run them through a tool like `screenshots.pro` or Figma to add
   the optional headline overlays for store presence polish.
4. Upload the 4-8 best ones to Play Console → Store presence → Main store
   listing → Phone screenshots.

---

## Notes

- **Don't use stock photos.** Use Roi (or any real dog you can borrow). Real
  dog photos in store listings convert significantly better than stock.
- **Keep the system clock visible** at the top of screenshots — it adds
  authenticity. (Set the demo emulator clock to 09:41 in honour of Apple's
  classic keynote time.)
- **Status bar:** make sure no debug battery overlay or notification is
  visible. Use the emulator's clean status bar.
- **Order matters:** Play Console displays screenshots left-to-right in the
  order you upload them. The first 2 are the most important — they're what
  show up in search results before someone taps in.
