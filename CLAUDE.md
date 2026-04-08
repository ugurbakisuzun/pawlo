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
