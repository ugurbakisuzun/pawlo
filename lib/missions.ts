// ─── Daily Mission System ─────────────────────────────────────────────────
// Generates 3 personalized daily missions based on active training programs.
// Uses date as seed for deterministic daily rotation.
//
// Slot 1: Training session for one of the user's active programs (rotates daily)
// Slot 2-3: Quick challenges relevant to the active program categories + general

export interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;
  xp_reward: number;
  type: "sa_session" | "quick_challenge";
  challengeAction?: string;
}

// ─── Program metadata ─────────────────────────────────────────────────────

const PROGRAM_INFO: Record<string, { title: string; emoji: string; goalCategory: string }> = {
  "separation-anxiety": { title: "Separation Anxiety", emoji: "🏠", goalCategory: "separation" },
  "leash-walking":      { title: "Leash Walking",      emoji: "🦮", goalCategory: "leash" },
  "recall-training":    { title: "Recall Training",    emoji: "📣", goalCategory: "recall" },
  "potty-training":     { title: "Potty Training",     emoji: "🚽", goalCategory: "potty" },
};

// ─── Quick challenge pool ─────────────────────────────────────────────────

const CHALLENGE_POOL: Mission[] = [
  // Separation / alone
  { id: "ch_door", title: "Door Desensitization", description: "Touch your keys and door handle 5 times without leaving. Reward calm behaviour.", emoji: "🚪", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Picked up keys 5x, rewarded calm behaviour" },
  { id: "ch_alone_1min", title: "1-Minute Alone", description: "Leave the room for 1 minute. Return calmly and reward.", emoji: "⏱️", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Left room for 1 minute, returned calmly" },
  { id: "ch_departure_cues", title: "Departure Cue Practice", description: "Put on shoes and coat, then sit down. Do this 3 times.", emoji: "🧥", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Practiced departure cues 3x without leaving" },

  // Recall
  { id: "ch_name_game", title: "Name Game", description: "Say your dog's name 10 times, reward every look. Build name recognition!", emoji: "📣", category: "recall", xp_reward: 15, type: "quick_challenge", challengeAction: "Said name 10 times, rewarded every look" },
  { id: "ch_come_indoor", title: "Indoor Recall", description: "Call your dog from another room 3 times. Reward each time!", emoji: "🏃", category: "recall", xp_reward: 15, type: "quick_challenge", challengeAction: "Called dog from another room 3x" },

  // Leash
  { id: "ch_leash_on", title: "Leash On, Leash Off", description: "Put the leash on and off 5 times. Reward calm acceptance.", emoji: "🦮", category: "leash", xp_reward: 15, type: "quick_challenge", challengeAction: "Leash on/off 5 times, rewarded calm behaviour" },
  { id: "ch_heel_indoor", title: "Indoor Heel Walk", description: "Walk 10 steps with your dog beside you indoors. Use treats!", emoji: "🦶", category: "leash", xp_reward: 15, type: "quick_challenge", challengeAction: "10-step heel walk indoors completed" },

  // Impulse / general
  { id: "ch_wait_treat", title: "Treat Patience", description: "Place a treat on the ground. Ask your dog to wait 5 seconds before eating.", emoji: "🧘", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Dog waited 5 seconds for treat" },
  { id: "ch_eye_contact", title: "Eye Contact Challenge", description: "Hold eye contact with your dog for 10 seconds. Reward after!", emoji: "👀", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "10-second eye contact achieved" },
  { id: "ch_leave_it", title: "Leave It Practice", description: "Hold a treat in a closed fist. Reward when your dog looks away.", emoji: "🚫", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Leave it practiced with closed fist" },

  // Socialization
  { id: "ch_new_sound", title: "Sound Exposure", description: "Play a new sound (doorbell, siren, thunder) at low volume. Reward calm behaviour.", emoji: "🔊", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "New sound exposure with calm reward" },
  { id: "ch_handling", title: "Gentle Handling", description: "Touch your dog's paws, ears, and tail gently. Reward after each touch.", emoji: "🤲", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Paws, ears, tail handling completed" },

  // Potty
  { id: "ch_potty_schedule", title: "Potty Schedule Check", description: "Take your dog out right after waking, eating, or playing. Log the time!", emoji: "🚽", category: "potty", xp_reward: 15, type: "quick_challenge", challengeAction: "Potty break completed on schedule" },

  // Biting / jumping / chewing
  { id: "ch_redirect_bite", title: "Redirect the Nip", description: "If your dog mouths you, redirect to a toy. Do this 3 times today.", emoji: "😬", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Redirected mouthing to toy 3x" },
  { id: "ch_four_paws", title: "Four on the Floor", description: "When greeting, only pet when all 4 paws are on the ground. Practice 3x.", emoji: "🐕", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Rewarded four-on-floor greeting 3x" },
  { id: "ch_chew_toy", title: "Chew Swap", description: "If your dog chews something wrong, swap it with an approved chew toy. 3 times.", emoji: "🦴", category: "general", xp_reward: 15, type: "quick_challenge", challengeAction: "Redirected chewing to toy 3x" },

  // General daily
  { id: "ch_5min_play", title: "5-Minute Play Session", description: "Spend 5 focused minutes playing with your dog. No phones!", emoji: "🎾", category: "general", xp_reward: 10, type: "quick_challenge", challengeAction: "5-minute focused play session completed" },
  { id: "ch_training_review", title: "Review Yesterday", description: "Repeat the last trick or exercise your dog learned. Reinforce!", emoji: "🔄", category: "general", xp_reward: 10, type: "quick_challenge", challengeAction: "Reviewed previous training" },
];

// ─── Deterministic daily seed ─────────────────────────────────────────────

function dateToSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Generate daily missions ──────────────────────────────────────────────

export function generateDailyMissions(
  activeProgramSlugs: string[],
  trainingGoals: string[],
  dogLevel: number,
  date: Date = new Date(),
): Mission[] {
  const seed = dateToSeed(date);
  const rng = seededRandom(seed);
  const missions: Mission[] = [];
  const usedIds = new Set<string>();

  // ── Slot 1: Training session for one active program (rotates daily) ──
  if (activeProgramSlugs.length > 0) {
    const shuffledSlugs = shuffle(activeProgramSlugs, rng);
    const slug = shuffledSlugs[0];
    const info = PROGRAM_INFO[slug] ?? { title: slug, emoji: "🐾", goalCategory: "general" };
    const mission: Mission = {
      id: `program_${slug}`,
      title: `${info.title} Session`,
      description: `Complete today's ${info.title.toLowerCase()} training session`,
      emoji: info.emoji,
      category: info.goalCategory,
      xp_reward: 30,
      type: "sa_session",
    };
    missions.push(mission);
    usedIds.add(mission.id);
  }

  // ── Slots 2-3: Quick challenges relevant to active programs + general ──
  const relevantCategories = new Set(["general"]);
  for (const slug of activeProgramSlugs) {
    const info = PROGRAM_INFO[slug];
    if (info) relevantCategories.add(info.goalCategory);
  }
  for (const goal of trainingGoals) {
    relevantCategories.add(goal);
  }

  const relevantChallenges = CHALLENGE_POOL.filter(
    (c) => relevantCategories.has(c.category),
  );
  const shuffledChallenges = shuffle(
    relevantChallenges.filter((c) => !usedIds.has(c.id)),
    rng,
  );

  for (let i = 0; i < 2 && i < shuffledChallenges.length; i++) {
    missions.push(shuffledChallenges[i]);
    usedIds.add(shuffledChallenges[i].id);
  }

  // Fallback: if we still don't have 3, pull from the entire challenge pool
  if (missions.length < 3) {
    const fallback = shuffle(
      CHALLENGE_POOL.filter((c) => !usedIds.has(c.id)),
      rng,
    );
    while (missions.length < 3 && fallback.length > 0) {
      missions.push(fallback.shift()!);
    }
  }

  return missions.slice(0, 3);
}

// ─── Bonus for completing all 3 ──────────────────────────────────────────

export const ALL_MISSIONS_BONUS_XP = 30;

export function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
