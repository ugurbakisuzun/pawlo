# Pawlo

Your dog's personal teacher. The Duolingo for dog training.

Pawlo is a gamified, AI-powered dog training app — bite-size daily lessons, instant feedback, real progress. Pawlo (the mascot + AI character) is the warm, persistent teacher every dog deserves.

## Tech Stack
- **Frontend:** Expo (React Native + TypeScript), expo-router
- **Backend:** Supabase (auth, DB, RLS, Edge Functions)
- **AI:** Anthropic Claude Haiku via `claude-chat` Edge Function (key never ships in client)
- **Build:** EAS Build (iOS + Android)
- **Landing page:** Static HTML in `web/`, deployed to Cloudflare Pages

## Brand
- **Name:** Pawlo
- **Tagline:** Your dog's personal teacher
- **Vibe:** Duolingo for dogs — friendly, persistent, mascot-led
- **AI character name:** Pawlo (same as the app — the mascot IS the brand)
- **Domains:** `pawlo.so` (primary), `usepawlo.com` → redirect to pawlo.so
- **Palette:** Dark night-blue (#0F0B2E) + gold (#FAC775) — distinctive vs Duolingo's green

## Key Architecture
- ~15 screens: index, signup, setup, dashboard, session, levelup, advisor, tricks, calendar, badges, leaderboard, walk, walkdetail, health, profile, modal
- XP/Level system (6 levels, Curious Pup → Top Dog)
- Streak system (24h/48h logic)
- 4 multi-day training programs in Supabase: separation-anxiety (21d), leash-walking (14d), recall-training (10d), potty-training (7d)
- Programs are user-selectable in onboarding step 11; editable from dashboard
- 12-trick library with completion tracking
- Daily missions (3/day) + bonus XP for completing all
- Badge system with auto-award + revoke on undo
- Walks (GPS), health (weight, vaccinations, medications) tracking
- Calendar aggregates training/tricks/walks/meds/vax events
- Push notifications (19:00 daily reminder)
- Voice recognition with Expo Go fallback (TextInput)
- Profile page with edit mode + delete account RPC

## Supabase
**Tables:** profiles, dogs, tricks, training_programs, training_sessions, completed_tricks, completed_missions, daily_mission_completions, xp_events, earned_badges, walks, weight_logs, vaccinations, medications, waitlist_signups

**Edge Functions:** `claude-chat` (proxy to Anthropic, manual auth via `sb.auth.getUser(token)`, verify_jwt: false because the new `sb_publishable_*` key format breaks gateway-level verification)

**RPCs:** `delete_user_account` (SECURITY DEFINER, wipes dog + cascades + profile + auth.users)

## Important Notes
- `dogs.active_program_slugs text[]` stores which programs the user picked in onboarding
- `training_sessions.program_slug` distinguishes sessions across programs
- Dark-mode only
- First target user: Roi (Maltichon, Katie Brill's dog, London) — beta launch around Day 30

## EAS Build
- Account: ugurbakisuzun
- Project ID: 5280bbef-b580-48ae-bb05-e137b842fc2e
- Bundle id (iOS): com.ugurbakisuzun.pawlo
- Package (Android): com.ugurbakisuzun.pawlo

## Notion Sync (Pawlo HQ)

Pawlo HQ is the single source of truth for planning, tracking, and institutional memory. If the Notion MCP is connected, Claude Code should read from and write to Notion as part of the normal workflow — not as an afterthought.

**Workspace root:** [Pawlo HQ](https://www.notion.so/33db5fff5e4d819a80b8d08129d45cc3) — `33db5fff5e4d819a80b8d08129d45cc3`

### Core (dev & product) — `33db5fff5e4d8108b9ffe2d0265a51df`
| Resource | Page ID | Data Source ID |
|---|---|---|
| Task Board (database) | `f8dd3a1cacd34b9fadd19009ba402a1d` | `collection://3c5c6453-b85e-44ae-a8d8-6f36f400582a` |
| Product Roadmap (database) | `30fc3867818d46fbbc62363a44c76826` | `collection://4b581d0d-5a48-4201-a1e1-d1cb07039527` |
| Bug Tracker (database) | `89930fee493648a99f2c042eb54e8047` | `collection://6cfcfb11-a16c-4af3-8acf-1c810c0b79ff` |
| Tech Stack & Architecture (page) | `33db5fff5e4d8168a728efc1beb2eec6` | — |
| Release Log (page) | `33db5fff5e4d81749ba7f2e14b3b5225` | — |

### Business (strategy & finance) — `33db5fff5e4d814694fdfa779cc179c2`
| Resource | Page ID | Data Source ID |
|---|---|---|
| OKRs (database) | `adedd586ff324bfd82706de08507c673` | `collection://c3f1baf4-2b92-4416-ba6b-88e581662548` |
| Investor CRM (database) | `b055908a6f844426b3a1a6b3b58ce6d6` | `collection://ebaafb44-2d70-4a4b-a76a-a54f1fa7649e` |
| Competitive Landscape (database) | `aec9ee3653794609949a6ebaef2fd5bb` | `collection://dea84208-5d8f-404b-9686-1dbdbce7c1ab` |
| KPI Dashboard (page) | `33db5fff5e4d81d899d6f294a9092cd8` | — |
| Financial Model (page) | `33db5fff5e4d8134a50be93b68dbf5a3` | — |

### Growth (marketing & launch) — `33db5fff5e4d816f8988ef53fcb51b04`
| Resource | Page ID | Data Source ID |
|---|---|---|
| Marketing Calendar (database) | `eaa06ac7ba5445368766dcb0c664d008` | `collection://8853e5a2-101f-4f6d-89f8-f378c5da200c` |
| Content Hub (database) | `ced7ac90eb6a4db78db0b7fa86cb7362` | `collection://46cc68ee-9b84-4060-bb07-974e0577f046` |
| Growth Experiments (database) | `ebe3f0a9e1684c319fb60d5a9c680544` | `collection://03049e06-3cb2-4b04-aba6-5d9e096fbf69` |
| Launch Playbook (page) | `33db5fff5e4d81c1b632e8913ddcc1e9` | — |
| Brand Guidelines (page) | `33db5fff5e4d81eab913f03fa536ae90` | — |

### Operations (team & admin) — `33db5fff5e4d81599e32f17e49019a7d`
| Resource | Page ID | Data Source ID |
|---|---|---|
| Meeting Notes (database) | `f39fcbf99913414f9eca408b3483aa18` | `collection://abeaf779-3e0a-48fd-99a2-759757f6026c` |
| Hiring Pipeline (database) | `7134a69732424d149de6e83fc562b3e1` | `collection://70c53f98-0585-4907-9dc0-d403058c90f3` |
| Tools & Subscriptions (database) | `98f939693e09496ca458359971939177` | `collection://70ef6353-db90-48e4-981f-aadafaa897b8` |
| Company Wiki (page) | `33db5fff5e4d81639396c7d1fc45ba51` | — |
| Legal & Policies (page) | `33db5fff5e4d8199a31af07eef94efd7` | — |

### Sync rules — when Claude Code should read Notion
- **Start of every dev session:** query Task Board for items where `Status = In Progress` or `Status = Todo` AND `Assignee` is Ugur (or unassigned). Surface these as the day's plan before touching code.
- **Before planning a new feature:** check Product Roadmap for related items — don't duplicate, link or update the existing row.
- **When a user reports a bug:** check Bug Tracker for duplicates first. If new, create a row with repro steps, stack trace, and severity.
- **When asked "what's next":** pull from OKRs (Business) + Product Roadmap (Core) and reconcile against current sprint theme.
- **When updating Tech Stack:** cross-check the Tech Stack & Architecture page — if out of date vs. reality, update both.

### Sync rules — when Claude Code should write to Notion
- **Task completion:** when a task in Task Board is finished, update its row: `Status → Done`, add the commit SHA / PR link to the `Notes` or `Links` property, set `Completed At`.
- **New task discovered during coding:** if the user says "let's also do X" or Claude Code identifies scope creep, create a new Task Board row (`Status = Todo`) with a short description and link back to the originating task.
- **Bug found:** create a Bug Tracker row immediately. Include: repro steps, expected vs. actual, severity (P0/P1/P2/P3), file path, line number, and a link to the commit or file on GitHub.
- **Feature shipped:** append a bullet to Release Log page with date, version (from `app.json`), and what changed. Format: `YYYY-MM-DD — vX.Y.Z — short summary (Task #abc)`.
- **Architecture decision:** when a non-trivial tech choice is made (new library, schema change, new Edge Function), update the Tech Stack & Architecture page with a short ADR-style note (Context → Decision → Consequences).
- **Schema change:** any migration to Supabase tables should also update the `## Supabase` section of this CLAUDE.md file AND the Tech Stack & Architecture page.

### Task status workflow
`Backlog` → `Todo` (pulled into sprint) → `In Progress` (actively being worked) → `In Review` (PR open) → `Done` (merged + shipped) → `Archived` (after retro)

Only Claude Code (or Ugur manually) moves things into `In Progress`, `In Review`, and `Done`. Backlog grooming happens weekly.

### Commit message convention
Reference Task Board items in commit messages using the short Notion page ID:
```
feat(dashboard): add streak badge animation

Refs Notion task f8dd3a1c (Task Board)
```
This makes it easy to grep history and lets Claude Code auto-link commits back to Notion rows.

### Daily ritual (automatable)
1. **Morning pull (09:00):** Claude Code fetches `Task Board` (Todo + In Progress), `Bug Tracker` (open P0/P1), and today's `Marketing Calendar` items. Summarizes as the day's plan.
2. **During work:** Claude Code updates task status in real time as things move.
3. **Evening push (19:00):** Claude Code reads today's `git log`, matches commits to Task Board rows, marks completed tasks as `Done`, and appends shipped items to Release Log.

### Weekly ritual
1. **Monday:** pull KPI Dashboard numbers, log them, compare to last week. Update OKRs progress.
2. **Friday:** review Growth Experiments, kill losers, promote winners. Write a 3-bullet week-in-review to Meeting Notes.

### Rules of thumb
- **Never delete a Notion row silently.** Archive instead. Institutional memory matters.
- **Always include a link.** Commits → Notion, Notion → GitHub, Notion → Supabase dashboard URLs where relevant.
- **CLAUDE.md is the bootstrap, Notion is the living doc.** This file tells Claude Code how to find Notion. Notion tells Claude Code what to do.
- **If Notion and code disagree, code wins and Notion gets updated.** Reality trumps the plan.
