// ─── Daily Mission System ─────────────────────────────────────────────────
// Generates 3 personalized daily missions based on dog profile.
// Uses date as seed for deterministic daily rotation.

export interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: string;         // training, trick, challenge, social
  xp_reward: number;
  type: "sa_session" | "trick" | "quick_challenge";
  // For trick type:
  trickCategory?: string;
  // For quick challenge:
  challengeAction?: string;
}

// ─── Mission Pool ─────────────────────────────────────────────────────────

const MISSION_POOL: Mission[] = [
  // Training missions
  { id: "sa_daily", title: "Daily Training Session", description: "Complete any training program session today", emoji: "🐾", category: "separation", xp_reward: 30, type: "sa_session" },

  // Trick missions (by category)
  { id: "trick_basic", title: "Practice a Basic Trick", description: "Complete any Basic trick from the library", emoji: "🎯", category: "tricks", xp_reward: 20, type: "trick", trickCategory: "Basic" },
  { id: "trick_fun", title: "Learn Something Fun", description: "Complete any Fun trick from the library", emoji: "🎪", category: "tricks", xp_reward: 25, type: "trick", trickCategory: "Fun" },
  { id: "trick_safety", title: "Safety First", description: "Complete any Safety trick", emoji: "🛡️", category: "tricks", xp_reward: 25, type: "trick", trickCategory: "Safety" },
  { id: "trick_advanced", title: "Advanced Challenge", description: "Complete any Advanced trick", emoji: "⚡", category: "tricks", xp_reward: 35, type: "trick", trickCategory: "Advanced" },
  { id: "trick_any", title: "Trick Time", description: "Complete any trick from the library", emoji: "🌟", category: "tricks", xp_reward: 20, type: "trick" },

  // Quick challenges — separation/alone related
  { id: "ch_door", title: "Door Desensitization", description: "Touch your keys and door handle 5 times without leaving. Reward calm behaviour.", emoji: "🚪", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Picked up keys 5x, rewarded calm behaviour" },
  { id: "ch_alone_1min", title: "1-Minute Alone", description: "Leave the room for 1 minute. Return calmly and reward.", emoji: "⏱️", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Left room for 1 minute, returned calmly" },
  { id: "ch_departure_cues", title: "Departure Cue Practice", description: "Put on shoes and coat, then sit down. Do this 3 times.", emoji: "🧥", category: "separation", xp_reward: 15, type: "quick_challenge", challengeAction: "Practiced departure cues 3x without leaving" },

  // Quick challenges — recall
  { id: "ch_name_game", title: "Name Game", description: "Say your dog's name 10 times, reward every look. Build name recognition!", emoji: "📣", category: "recall", xp_reward: 15, type: "quick_challenge", challengeAction: "Said name 10 times, rewarded every look" },
  { id: "ch_come_indoor", title: "Indoor Recall", description: "Call your dog from another room 3 times. Reward each time!", emoji: "🏃", category: "recall", xp_reward: 15, type: "quick_challenge", challengeAction: "Called dog from another room 3x" },

  // Quick challenges — leash
  { id: "ch_leash_on", title: "Leash On, Leash Off", description: "Put the leash on and off 5 times. Reward calm acceptance.", emoji: "🦮", category: "leash", xp_reward: 15, type: "quick_challenge", challengeAction: "Leash on/off 5 times, rewarded calm behaviour" },
  { id: "ch_heel_indoor", title: "Indoor Heel Walk", description: "Walk 10 steps with your dog beside you indoors. Use treats!", emoji: "🦶", category: "leash", xp_reward: 15, type: "quick_challenge", challengeAction: "10-step heel walk indoors completed" },

  // Quick challenges — impulse
  { id: "ch_wait_treat", title: "Treat Patience", description: "Place a treat on the ground. Ask your dog to wait 5 seconds before eating.", emoji: "🧘", category: "impulse", xp_reward: 15, type: "quick_challenge", challengeAction: "Dog waited 5 seconds for treat" },
  { id: "ch_eye_contact", title: "Eye Contact Challenge", description: "Hold eye contact with your dog for 10 seconds. Reward after!", emoji: "👀", category: "impulse", xp_reward: 15, type: "quick_challenge", challengeAction: "10-second eye contact achieved" },
  { id: "ch_leave_it", title: "Leave It Practice", description: "Hold a treat in a closed fist. Reward when your dog looks away.", emoji: "🚫", category: "impulse", xp_reward: 15, type: "quick_challenge", challengeAction: "Leave it practiced with closed fist" },

  // Quick challenges — socialization
  { id: "ch_new_sound", title: "Sound Exposure", description: "Play a new sound (doorbell, siren, thunder) at low volume. Reward calm behaviour.", emoji: "🔊", category: "socialization", xp_reward: 15, type: "quick_challenge", challengeAction: "New sound exposure with calm reward" },
  { id: "ch_handling", title: "Gentle Handling", description: "Touch your dog's paws, ears, and tail gently. Reward after each touch.", emoji: "🤲", category: "socialization", xp_reward: 15, type: "quick_challenge", challengeAction: "Paws, ears, tail handling completed" },

  // Quick challenges — potty
  { id: "ch_potty_schedule", title: "Potty Schedule Check", description: "Take your dog out right after waking, eating, or playing. Log the time!", emoji: "🚽", category: "potty", xp_reward: 15, type: "quick_challenge", challengeAction: "Potty break completed on schedule" },

  // Quick challenges — biting
  { id: "ch_redirect_bite", title: "Redirect the Nip", description: "If your dog mouths you, redirect to a toy. Do this 3 times today.", emoji: "😬", category: "biting", xp_reward: 15, type: "quick_challenge", challengeAction: "Redirected mouthing to toy 3x" },

  // Quick challenges — jumping
  { id: "ch_four_paws", title: "Four on the Floor", description: "When greeting, only pet when all 4 paws are on the ground. Practice 3x.", emoji: "🐕", category: "jumping", xp_reward: 15, type: "quick_challenge", challengeAction: "Rewarded four-on-floor greeting 3x" },

  // Quick challenges — chewing
  { id: "ch_chew_toy", title: "Chew Swap", description: "If your dog chews something wrong, swap it with an approved chew toy. 3 times.", emoji: "🦴", category: "chewing", xp_reward: 15, type: "quick_challenge", challengeAction: "Redirected chewing to toy 3x" },

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
  trainingGoals: string[],
  dogLevel: number,
  date: Date = new Date(),
): Mission[] {
  const seed = dateToSeed(date);
  const rng = seededRandom(seed);

  // Filter pool: relevant to user's goals + general
  const relevant = MISSION_POOL.filter(
    (m) =>
      m.category === "general" ||
      m.category === "tricks" ||
      trainingGoals.includes(m.category),
  );

  // Always include SA session if user has separation goal
  const hasSA = trainingGoals.includes("separation");

  // Separate by type
  const saSession = relevant.find((m) => m.type === "sa_session");
  const tricks = relevant.filter((m) => m.type === "trick");
  const challenges = relevant.filter((m) => m.type === "quick_challenge");

  // Filter advanced tricks by level
  const availableTricks = tricks.filter((t) => {
    if (t.id === "trick_advanced" && dogLevel < 3) return false;
    return true;
  });

  const missions: Mission[] = [];

  // Slot 1: SA session (if goal) or a trick
  if (hasSA && saSession) {
    missions.push(saSession);
  } else {
    const shuffledTricks = shuffle(availableTricks, rng);
    if (shuffledTricks.length > 0) missions.push(shuffledTricks[0]);
  }

  // Slot 2: A trick mission
  const usedIds = new Set(missions.map((m) => m.id));
  const remainingTricks = shuffle(
    availableTricks.filter((t) => !usedIds.has(t.id)),
    rng,
  );
  if (remainingTricks.length > 0) {
    missions.push(remainingTricks[0]);
    usedIds.add(remainingTricks[0].id);
  }

  // Slot 3: A quick challenge
  const shuffledChallenges = shuffle(
    challenges.filter((c) => !usedIds.has(c.id)),
    rng,
  );
  if (shuffledChallenges.length > 0) {
    missions.push(shuffledChallenges[0]);
  }

  // Fallback: fill up to 3
  if (missions.length < 3) {
    const allShuffled = shuffle(
      MISSION_POOL.filter((m) => !usedIds.has(m.id)),
      rng,
    );
    while (missions.length < 3 && allShuffled.length > 0) {
      missions.push(allShuffled.shift()!);
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
