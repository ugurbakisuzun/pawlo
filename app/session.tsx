import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Palette, Radius, Spacing } from "../constants/theme";
import { sendSessionCompleteNotification } from "../lib/notifications";
import { SoundPanel } from "../components/SoundPanel";
import { computeLevel, useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

const C = Colors.dark;

// ── Speech recognition (optional — falls back to TextInput in Expo Go) ──

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
try {
  const mod = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {}

// ── Types ───────────────────────────────────────────────────────────────

interface ProgramStep {
  number: number;
  instruction: string;
  duration_seconds: number;
  break_seconds: number;
  voice_prompt: string | null;
}

interface ProgramDay {
  day: number;
  title: string;
  goal: string;
  steps: ProgramStep[];
}

interface Observation {
  stepIndex: number;
  transcript: string;
}

// ── Component ───────────────────────────────────────────────────────────

export default function SessionScreen() {
  const params = useLocalSearchParams();
  const dayNumber = Number(params.day) || 1;
  const programSlug = (params.slug as string) || "separation-anxiety";
  const programTitle = params.programTitle
    ? decodeURIComponent(params.programTitle as string)
    : "Training";
  const trickName = params.trickName as string | undefined;
  const trickDesc = params.trickDesc as string | undefined;
  const trickXp = Number(params.trickXp) || 80;
  const trickId = params.trickId as string | undefined;
  const trickSteps: string[] | undefined = params.trickSteps
    ? JSON.parse(params.trickSteps as string)
    : undefined;

  const {
    dog,
    setDog,
    syncCompletedTrick,
    checkAndAwardBadges,
    loadBadges,
    completeDailyMission,
    dailyMissions,
    completedDailyIds,
  } = useStore();

  // ── Core state ──
  const [dayData, setDayData] = useState<ProgramDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Observation / feedback ──
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Session summary ──
  const [sessionPhase, setSessionPhase] = useState<"active" | "summary">("active");
  const [sessionRating, setSessionRating] = useState(0);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ── Break timer ──
  const [breakTimer, setBreakTimer] = useState<{ stepIndex: number; remaining: number } | null>(null);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const isTrickMode = !!trickName;
  const hasNativeSpeech = !!ExpoSpeechRecognitionModule;

  // ── Speech recognition events ──

  useSpeechRecognitionEvent("result", (event: any) => {
    const text = event.results[0]?.transcript ?? "";
    if (text) {
      setCurrentTranscript(text);
      setIsListening(false);
    }
  });
  useSpeechRecognitionEvent("error", () => setIsListening(false));
  useSpeechRecognitionEvent("end", () => setIsListening(false));

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // ── Break timer tick ──

  useEffect(() => {
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, []);

  const startBreakTimer = (stepIndex: number, seconds: number) => {
    if (seconds <= 0) return;
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    setBreakTimer({ stepIndex, remaining: seconds });
    breakIntervalRef.current = setInterval(() => {
      setBreakTimer((t) => {
        if (!t || t.remaining <= 1) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          breakIntervalRef.current = null;
          // Auto-expand next step when break finishes
          if (dayData) {
            const nextIndex = stepIndex + 1;
            if (nextIndex < dayData.steps.length) {
              setExpandedStep(nextIndex);
            }
          }
          return null;
        }
        return { ...t, remaining: t.remaining - 1 };
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Load program day ──

  useEffect(() => {
    if (isTrickMode) {
      setDayData({
        day: 0,
        title: trickName!,
        goal: trickDesc || "",
        steps: (trickSteps || []).map((instruction, i) => ({
          number: i + 1,
          instruction,
          duration_seconds: 0,
          break_seconds: 60,
          voice_prompt:
            i === (trickSteps?.length ?? 1) - 1
              ? "How did the session go? What did your dog do best?"
              : null,
        })),
      });
      setLoading(false);
      setExpandedStep(0);
      return;
    }
    loadDay();
  }, []);

  const loadDay = async () => {
    try {
      const { data, error } = await supabase
        .from("training_programs")
        .select("content")
        .eq("slug", programSlug)
        .single();
      if (error) throw error;
      const days: ProgramDay[] = data.content;
      const found = days.find((d) => d.day === dayNumber);
      const sorted = [...days].sort(
        (a, b) => Math.abs(a.day - dayNumber) - Math.abs(b.day - dayNumber),
      );
      setDayData(found ?? sorted[0] ?? null);
      setExpandedStep(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Voice input ──

  const startListening = async () => {
    if (!hasNativeSpeech) return;
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        alert("Microphone permission required.");
        return;
      }
      setCurrentTranscript("");
      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        continuous: true,
        interimResults: false,
      });
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (ExpoSpeechRecognitionModule) ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
  };

  // ── Step completion ──

  const completeStep = (index: number) => {
    if (completedSteps.includes(index)) return;
    setCompletedSteps((prev) => [...prev, index]);

    const step = dayData?.steps[index];
    if (step?.voice_prompt) {
      // Show feedback card
      setActivePromptIndex(index);
      setCurrentTranscript("");
      setTextInput("");
    } else {
      // No feedback needed — start break + move on
      finishStepFlow(index);
    }
  };

  const saveObservation = (stepIndex: number) => {
    if (!currentTranscript.trim()) return;
    setObservations((prev) => [
      ...prev.filter((o) => o.stepIndex !== stepIndex),
      { stepIndex, transcript: currentTranscript.trim() },
    ]);
    setActivePromptIndex(null);
    finishStepFlow(stepIndex);
  };

  const submitTextObservation = (stepIndex: number) => {
    if (!textInput.trim()) return;
    setCurrentTranscript(textInput.trim());
    setObservations((prev) => [
      ...prev.filter((o) => o.stepIndex !== stepIndex),
      { stepIndex, transcript: textInput.trim() },
    ]);
    setTextInput("");
    setActivePromptIndex(null);
    finishStepFlow(stepIndex);
  };

  const tryAgain = () => {
    setCurrentTranscript("");
    setTextInput("");
  };

  const skipFeedback = (stepIndex: number) => {
    setActivePromptIndex(null);
    setCurrentTranscript("");
    finishStepFlow(stepIndex);
  };

  const finishStepFlow = (stepIndex: number) => {
    const step = dayData?.steps[stepIndex];
    // Start break timer if applicable
    if (step && step.break_seconds > 0) {
      startBreakTimer(stepIndex, step.break_seconds);
    } else if (dayData) {
      // No break — auto-expand next step
      const nextIndex = stepIndex + 1;
      if (nextIndex < dayData.steps.length) {
        setExpandedStep(nextIndex);
      }
    }

    // Check if all steps are done
    const allDone = dayData
      ? completedSteps.length + 1 >= dayData.steps.length
      : false;
    if (allDone) {
      setTimeout(() => setSessionPhase("summary"), 500);
    }
  };

  // ── Session summary AI call ──

  const runSummaryAnalysis = async () => {
    if (!dayData || !dog || observations.length === 0) return;
    setSummaryLoading(true);
    try {
      const obsLines = dayData.steps.map((step, i) => {
        const obs = observations.find((o) => o.stepIndex === i);
        return `Step ${step.number} (${step.instruction}): ${obs ? `"${obs.transcript}"` : "(no observation)"}`;
      }).join("\n");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const { data, error } = await supabase.functions.invoke("claude-chat", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: `You are Pawlo — the friendly dog teacher mascot. Warm, encouraging, and practical.
Dog: ${dog.name}, ${dog.breed ?? "unknown breed"}, Level ${dog.level ?? 1}.
Program: ${programTitle} · Day ${dayData.day} — ${dayData.title}.

The user just completed all ${dayData.steps.length} steps. Here are their observations:
${obsLines}

Give a warm 3-5 sentence analysis covering:
1. What went well (be specific, reference their observations)
2. Any patterns you notice
3. One actionable tip for next time
Use the dog's name. Be concise and jargon-free.`,
          messages: [{ role: "user", content: "Please analyse my session." }],
        },
      });

      if (error) throw error;
      setSummaryText(data?.content?.[0]?.text ?? "Great session — keep it up!");
    } catch {
      setSummaryText("Couldn't analyse right now — but great job completing the session! Keep it up.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (sessionPhase === "summary" && observations.length > 0 && !summaryText) {
      runSummaryAnalysis();
    }
  }, [sessionPhase]);

  // ── Handle done (save everything) ──

  const handleDone = async () => {
    if (!dog || saving) return;
    setSaving(true);
    try {
      const initialLevel = dog.level;
      const xpEarned = isTrickMode
        ? trickXp
        : Math.round(50 + (dayData?.steps.length ?? 5) * 10);
      const newXP = dog.total_xp + xpEarned;
      const newLevel = computeLevel(newXP);
      const now = new Date();

      const lastTrained = dog.last_trained_at
        ? new Date(dog.last_trained_at)
        : null;
      const diffHours = lastTrained
        ? (now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60)
        : 999;

      let newStreak: number;
      if (!lastTrained) newStreak = 1;
      else if (diffHours < 24) newStreak = Math.max(dog.streak_days, 1);
      else if (diffHours < 48) newStreak = dog.streak_days + 1;
      else newStreak = 1;

      const { data, error } = await supabase
        .from("dogs")
        .update({
          total_xp: newXP,
          level: newLevel,
          streak_days: newStreak,
          last_trained_at: now.toISOString(),
        })
        .eq("id", dog.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("xp_events").insert({
        dog_id: dog.id,
        amount: xpEarned,
        reason: isTrickMode
          ? `${trickName} trick`
          : `${programTitle} Day ${dayNumber}`,
      });

      if (!isTrickMode) {
        await supabase.from("training_sessions").insert({
          dog_id: dog.id,
          day_number: dayNumber,
          program_slug: programSlug,
          session_rating: sessionRating > 0 ? sessionRating : null,
          ai_summary: summaryText || null,
          observations: observations.length > 0 ? observations : null,
        });
      }

      setDog(data);

      if (isTrickMode && trickId) {
        await syncCompletedTrick(dog.id, trickId);
      }

      for (const m of dailyMissions) {
        if (completedDailyIds.includes(m.id)) continue;
        if (m.type === "sa_session" && !isTrickMode) {
          await completeDailyMission(dog.id, m.id);
        }
        if (m.type === "trick" && isTrickMode) {
          await completeDailyMission(dog.id, m.id);
        }
      }

      await loadBadges(dog.id);
      const newBadges = await checkAndAwardBadges(dog.id);
      await sendSessionCompleteNotification(dog.name, xpEarned, newStreak);

      const finalDog = useStore.getState().dog;
      const finalLevel = finalDog?.level ?? newLevel;
      const finalXP = finalDog?.total_xp ?? newXP;
      const leveledUp = finalLevel > initialLevel;

      if (newBadges.length > 0) {
        const badgeNames = newBadges.map((b) => `${b.emoji} ${b.name}`).join(", ");
        const badgeXP = newBadges.reduce((s, b) => s + b.xp_reward, 0);
        router.replace(
          leveledUp
            ? (`/levelup?level=${finalLevel}&xp=${finalXP}&name=${dog.name}&badges=${encodeURIComponent(badgeNames)}&badgeXP=${badgeXP}` as any)
            : (`/dashboard?newBadges=${encodeURIComponent(badgeNames)}&badgeXP=${badgeXP}` as any),
        );
      } else {
        router.replace(
          leveledUp
            ? (`/levelup?level=${finalLevel}&xp=${finalXP}&name=${dog.name}` as any)
            : ("/dashboard" as any),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ──

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.pawGold} />
      </View>
    );

  if (!dayData)
    return (
      <View style={styles.centered}>
        <Text style={{ color: C.text }}>Session not found.</Text>
      </View>
    );

  const totalSteps = dayData.steps.length;
  const progress = totalSteps > 0 ? completedSteps.length / totalSteps : 0;
  const xpEarned = isTrickMode ? trickXp : Math.round(50 + totalSteps * 10);

  // ── Summary phase ──

  if (sessionPhase === "summary") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={styles.summaryTitle}>Session complete!</Text>
          <Text style={styles.summarySubtitle}>
            {dayData.title} {!isTrickMode ? `· Day ${dayData.day}` : ""}
          </Text>

          <View style={styles.xpEarnedCard}>
            <Text style={styles.xpEarnedText}>⭐ +{xpEarned} XP earned</Text>
          </View>

          {/* Star rating */}
          <Text style={styles.ratingLabel}>How did this session go?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSessionRating(star)}
                style={styles.starBtn}
              >
                <Text style={[styles.starText, sessionRating >= star && styles.starFilled]}>
                  {sessionRating >= star ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI analysis */}
          {observations.length > 0 && (
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Text style={styles.analysisIcon}>🐾</Text>
                <Text style={styles.analysisTitle}>Pawlo's analysis</Text>
              </View>
              {summaryLoading ? (
                <View style={styles.analysisLoading}>
                  <ActivityIndicator size="small" color={Palette.levelPurple} />
                  <Text style={styles.analysisLoadingText}>
                    Pawlo is reviewing your session…
                  </Text>
                </View>
              ) : (
                <Text style={styles.analysisText}>{summaryText}</Text>
              )}
            </View>
          )}

          {observations.length === 0 && (
            <Text style={styles.noObsText}>
              No observations recorded this session. Try adding feedback next time — Pawlo will give you a personalised analysis!
            </Text>
          )}

          {/* Done button */}
          <TouchableOpacity
            style={[styles.doneBtn, (saving || summaryLoading) && styles.doneBtnDisabled]}
            onPress={handleDone}
            disabled={saving || summaryLoading}
          >
            {saving ? (
              <ActivityIndicator color={Palette.questNight} />
            ) : (
              <Text style={styles.doneBtnText}>Done — back to dashboard</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Active phase (step list) ──

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SoundPanel />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.stepCount}>{completedSteps.length}/{totalSteps}</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{isTrickMode ? "🐕" : "🐾"}</Text>
          <Text style={styles.heroTitle}>{dayData.title}</Text>
          {!isTrickMode && (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {dayData.day}</Text>
            </View>
          )}
          <Text style={styles.heroGoal}>{dayData.goal}</Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>⭐ Complete to earn +{xpEarned} XP</Text>
        </View>

        {/* Steps */}
        <Text style={styles.stepsTitle}>Step by step</Text>
        {dayData.steps.map((step, index) => {
          const done = completedSteps.includes(index);
          const isExpanded = expandedStep === index;
          const isAwaitingFeedback = activePromptIndex === index;
          const obs = observations.find((o) => o.stepIndex === index);
          const isBreaking = breakTimer?.stepIndex === index;

          return (
            <View key={index}>
              <TouchableOpacity
                style={[styles.stepItem, done && styles.stepDone, isExpanded && styles.stepExpanded]}
                onPress={() => {
                  if (!done) setExpandedStep(isExpanded ? null : index);
                }}
                activeOpacity={done ? 1 : 0.7}
              >
                {/* Step number / check */}
                <View style={[styles.stepNum, done && styles.stepNumDone]}>
                  <Text style={[styles.stepNumText, done && styles.stepNumTextDone]}>
                    {done ? "✓" : step.number}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepText, done && styles.stepTextDone]}>
                    {step.instruction}
                  </Text>

                  {/* Observation preview (collapsed, completed) */}
                  {done && obs && !isExpanded && (
                    <Text style={styles.obsPreview} numberOfLines={1}>
                      🎙 "{obs.transcript}"
                    </Text>
                  )}

                  {/* Duration hint (expanded, not yet done) */}
                  {isExpanded && !done && step.duration_seconds > 0 && (
                    <Text style={styles.durationHint}>
                      ⏱ Suggested: {step.duration_seconds}s
                      {step.break_seconds > 0 ? `  ·  🔄 ${step.break_seconds}s break after` : ""}
                    </Text>
                  )}

                  {/* Complete button (expanded, not yet done) */}
                  {isExpanded && !done && (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        completeStep(index);
                      }}
                    >
                      <Text style={styles.completeBtnText}>✓ Step completed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>

              {/* Feedback card (after step completion, awaiting voice/text input) */}
              {isAwaitingFeedback && step.voice_prompt && (
                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackQuestion}>{step.voice_prompt}</Text>

                  {/* Transcript display + Try again */}
                  {currentTranscript ? (
                    <View style={styles.transcriptBox}>
                      <Text style={styles.transcriptLabel}>Your observation:</Text>
                      <Text style={styles.transcriptText}>"{currentTranscript}"</Text>
                      <View style={styles.transcriptActions}>
                        <TouchableOpacity style={styles.tryAgainBtn} onPress={tryAgain}>
                          <Text style={styles.tryAgainText}>↻ Try again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveObsBtn}
                          onPress={() => saveObservation(index)}
                        >
                          <Text style={styles.saveObsText}>Save & continue →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : hasNativeSpeech ? (
                    /* Voice input */
                    <TouchableOpacity
                      style={[styles.micBtn, isListening && styles.micBtnActive]}
                      onPress={isListening ? stopListening : startListening}
                    >
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Text style={styles.micIcon}>{isListening ? "⏹" : "🎤"}</Text>
                      </Animated.View>
                      <Text style={styles.micLabel}>
                        {isListening ? "Tap to stop" : "Tap to record"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    /* Text fallback */
                    <View style={styles.textInputWrap}>
                      <TextInput
                        style={styles.observationInput}
                        placeholder="Describe what your dog did…"
                        placeholderTextColor={C.textMuted}
                        value={textInput}
                        onChangeText={setTextInput}
                        multiline
                        maxLength={300}
                      />
                      <TouchableOpacity
                        style={[styles.sendBtn, !textInput.trim() && styles.sendBtnDisabled]}
                        onPress={() => submitTextObservation(index)}
                        disabled={!textInput.trim()}
                      >
                        <Text style={[styles.sendBtnText, !textInput.trim() && styles.sendBtnTextDisabled]}>
                          Send →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.skipBtn}
                    onPress={() => skipFeedback(index)}
                  >
                    <Text style={styles.skipText}>Skip for now</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Break timer (auto-started after step completion) */}
              {isBreaking && breakTimer && (
                <View style={styles.breakBanner}>
                  <Text style={styles.breakEmoji}>☕</Text>
                  <Text style={styles.breakText}>
                    Break · {formatTime(breakTimer.remaining)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Bottom action — only if all steps done but phase is still active */}
        {completedSteps.length === totalSteps && sessionPhase === "active" && (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => setSessionPhase("summary")}
          >
            <Text style={styles.finishBtnText}>🎉 Finish session → Summary</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 12,
  },
  backText: { color: C.textSecondary, fontSize: 14 },
  progressBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: C.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Palette.pawGold,
    borderRadius: 3,
  },
  stepCount: { color: C.textSecondary, fontSize: 12, fontWeight: "600" },

  // ── Hero ──
  hero: { alignItems: "center", paddingHorizontal: Spacing.xl, marginBottom: 16 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: "rgba(127,119,221,0.2)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  dayBadgeText: { color: Palette.levelPurple, fontSize: 12, fontWeight: "700" },
  heroGoal: {
    color: C.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  xpBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(250,199,117,0.15)",
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  xpBadgeText: { color: Palette.pawGold, fontSize: 13, fontWeight: "700" },

  // ── Steps ──
  stepsTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: Spacing.xl,
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    marginBottom: 10,
    padding: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.lg,
    gap: 14,
  },
  stepExpanded: {
    borderColor: Palette.levelPurple,
    backgroundColor: "rgba(127,119,221,0.08)",
  },
  stepDone: {
    borderColor: "rgba(29,158,117,0.3)",
    backgroundColor: "rgba(29,158,117,0.06)",
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumDone: { backgroundColor: Palette.streakGreen },
  stepNumText: { color: C.text, fontSize: 14, fontWeight: "700" },
  stepNumTextDone: { color: "#fff" },
  stepText: { color: C.text, fontSize: 14, lineHeight: 20 },
  stepTextDone: { color: C.textSecondary },
  obsPreview: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  durationHint: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  completeBtn: {
    backgroundColor: Palette.pawGold,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 14,
  },
  completeBtnText: {
    color: Palette.questNight,
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Feedback card ──
  feedbackCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: 10,
    padding: 16,
    backgroundColor: "rgba(127,119,221,0.08)",
    borderWidth: 1,
    borderColor: "rgba(127,119,221,0.25)",
    borderRadius: Radius.lg,
  },
  feedbackQuestion: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },

  // Voice
  micBtn: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: Radius.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  micBtnActive: {
    borderColor: Palette.alertCoral,
    backgroundColor: "rgba(216,90,48,0.12)",
  },
  micIcon: { fontSize: 32, marginBottom: 6 },
  micLabel: { color: C.textSecondary, fontSize: 13 },

  // Transcript
  transcriptBox: {
    backgroundColor: C.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  transcriptLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  transcriptText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 14,
  },
  transcriptActions: {
    flexDirection: "row",
    gap: 10,
  },
  tryAgainBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  tryAgainText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  saveObsBtn: {
    flex: 1,
    backgroundColor: Palette.streakGreen,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveObsText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Text fallback
  textInputWrap: { gap: 10 },
  observationInput: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.md,
    padding: 12,
    color: C.text,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: Palette.pawGold,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: C.surface },
  sendBtnText: { color: Palette.questNight, fontSize: 14, fontWeight: "700" },
  sendBtnTextDisabled: { color: C.textMuted },

  skipBtn: { alignItems: "center", marginTop: 12, paddingVertical: 6 },
  skipText: { color: C.textMuted, fontSize: 13 },

  // ── Break timer ──
  breakBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.xl,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "rgba(29,158,117,0.1)",
    borderWidth: 1,
    borderColor: "rgba(29,158,117,0.25)",
    borderRadius: Radius.lg,
    gap: 8,
  },
  breakEmoji: { fontSize: 18 },
  breakText: { color: Palette.streakGreen, fontSize: 14, fontWeight: "700" },

  // ── Finish button ──
  finishBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: 20,
    backgroundColor: Palette.pawGold,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: "center",
  },
  finishBtnText: { color: Palette.questNight, fontSize: 16, fontWeight: "800" },

  // ── Summary phase ──
  summaryScroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: "center",
  },
  summaryEmoji: { fontSize: 56, marginBottom: 16 },
  summaryTitle: {
    color: C.text,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  summarySubtitle: {
    color: C.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  xpEarnedCard: {
    backgroundColor: "rgba(250,199,117,0.15)",
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  xpEarnedText: { color: Palette.pawGold, fontSize: 18, fontWeight: "800" },

  // Stars
  ratingLabel: {
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  starBtn: { padding: 4 },
  starText: { fontSize: 36, color: C.textMuted },
  starFilled: { color: Palette.pawGold },

  // Analysis
  analysisCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 32,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  analysisIcon: { fontSize: 22 },
  analysisTitle: { color: C.text, fontSize: 16, fontWeight: "700" },
  analysisLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  analysisLoadingText: { color: C.textSecondary, fontSize: 14 },
  analysisText: { color: C.textSecondary, fontSize: 15, lineHeight: 22 },
  noObsText: {
    color: C.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  // Done button
  doneBtn: {
    width: "100%",
    backgroundColor: Palette.pawGold,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    alignItems: "center",
  },
  doneBtnDisabled: { opacity: 0.5 },
  doneBtnText: { color: Palette.questNight, fontSize: 16, fontWeight: "800" },
});
