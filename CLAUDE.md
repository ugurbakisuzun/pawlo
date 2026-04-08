# PawQuest

Gamified AI-powered dog training app. "Level up your dog's life"

## Tech Stack
- **Frontend:** Expo (React Native + TypeScript)
- **Backend:** Supabase (auth, DB, RLS)
- **AI:** Anthropic Claude Haiku (in-app coaching)
- **Build:** EAS Build (iOS + Android)

## Key Architecture
- 10 screens: index, signup, setup, dashboard, session, levelup, advisor, tricks, calendar, modal
- XP/Level system (6 levels, Curious Pup → Alpha Quester)
- Streak system (24h/48h logic)
- 21-day Separation Anxiety program stored in Supabase
- 12 tricks in trick library with completion tracking
- Push notifications via expo-notifications (19:00 daily + session complete)
- Voice recognition with Expo Go fallback (TextInput)

## Supabase Tables
profiles, dogs, tricks, training_programs, training_sessions, session_steps, xp_events, completed_tricks

## Important Notes
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` is client-side — needs migration to Supabase Edge Function
- Email confirmation disabled in Supabase (development)
- `expo-speech-recognition` doesn't work in Expo Go — try/catch fallback exists
- User prefers complete file replacements over partial edits
- First target user: Roi (Maltichon, Katie Brill's dog, London)

## EAS Build
- Account: ugurbakisuzun
- Project ID: 5280bbef-b580-48ae-bb05-e137b842fc2e
