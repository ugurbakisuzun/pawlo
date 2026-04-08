import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Palette, Radius, Spacing } from "../constants/theme";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

const C = Colors.dark;

interface LeaderboardEntry {
  dog_id: string;
  dog_name: string;
  breed: string;
  level: number;
  total_xp: number;
  streak_days: number;
  period_xp: number;
  owner_id: string;
}

const PERIODS = [
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  { id: "all_time", label: "All Time" },
];

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze
const PODIUM_EMOJI = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen() {
  const { dog } = useStore();
  const [period, setPeriod] = useState("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        time_period: period,
      });
      if (error) throw error;
      setEntries(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const myRank = entries.findIndex((e) => e.dog_id === dog?.id) + 1;
  const myEntry = entries.find((e) => e.dog_id === dog?.id);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Period tabs */}
      <View style={styles.tabRow}>
        {PERIODS.map((p) => {
          const active = period === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setPeriod(p.id)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Palette.pawGold} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>No training data yet.</Text>
          <Text style={styles.emptySubtext}>
            Complete sessions to appear on the leaderboard!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Podium ── */}
          <View style={styles.podium}>
            {/* 2nd place */}
            <View style={styles.podiumSlot}>
              {top3[1] && (
                <>
                  <Text style={styles.podiumEmoji}>🐕</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3[1].dog_name}
                  </Text>
                  <Text style={styles.podiumXP}>{top3[1].period_xp} XP</Text>
                  <View style={[styles.podiumBar, styles.podiumBar2]}>
                    <Text style={styles.podiumMedal}>{PODIUM_EMOJI[1]}</Text>
                  </View>
                </>
              )}
            </View>

            {/* 1st place */}
            <View style={styles.podiumSlot}>
              {top3[0] && (
                <>
                  <Text style={styles.podiumCrown}>👑</Text>
                  <Text style={styles.podiumEmoji}>🦮</Text>
                  <Text style={[styles.podiumName, { color: Palette.pawGold }]} numberOfLines={1}>
                    {top3[0].dog_name}
                  </Text>
                  <Text style={[styles.podiumXP, { color: Palette.pawGold }]}>
                    {top3[0].period_xp} XP
                  </Text>
                  <View style={[styles.podiumBar, styles.podiumBar1]}>
                    <Text style={styles.podiumMedal}>{PODIUM_EMOJI[0]}</Text>
                  </View>
                </>
              )}
            </View>

            {/* 3rd place */}
            <View style={styles.podiumSlot}>
              {top3[2] && (
                <>
                  <Text style={styles.podiumEmoji}>🐶</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3[2].dog_name}
                  </Text>
                  <Text style={styles.podiumXP}>{top3[2].period_xp} XP</Text>
                  <View style={[styles.podiumBar, styles.podiumBar3]}>
                    <Text style={styles.podiumMedal}>{PODIUM_EMOJI[2]}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── My Rank (if not in top 3) ── */}
          {myEntry && myRank > 3 && (
            <View style={styles.myRankCard}>
              <Text style={styles.myRankLabel}>YOUR RANK</Text>
              <View style={styles.myRankRow}>
                <Text style={styles.myRankNum}>#{myRank}</Text>
                <View style={styles.myRankInfo}>
                  <Text style={styles.myRankName}>{myEntry.dog_name}</Text>
                  <Text style={styles.myRankBreed}>{myEntry.breed}</Text>
                </View>
                <View style={styles.myRankXPWrap}>
                  <Text style={styles.myRankXP}>{myEntry.period_xp}</Text>
                  <Text style={styles.myRankXPLabel}>XP</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Rest of list ── */}
          <View style={styles.listSection}>
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = entry.dog_id === dog?.id;
              return (
                <View
                  key={entry.dog_id}
                  style={[styles.listRow, isMe && styles.listRowMe]}
                >
                  <Text style={[styles.listRank, isMe && { color: Palette.pawGold }]}>
                    {rank}
                  </Text>
                  <View style={styles.listAvatar}>
                    <Text style={{ fontSize: 20 }}>🐾</Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, isMe && { color: Palette.pawGold }]}>
                      {entry.dog_name} {isMe ? "(You)" : ""}
                    </Text>
                    <Text style={styles.listMeta}>
                      Lv.{entry.level} · {entry.breed} · 🔥{entry.streak_days}
                    </Text>
                  </View>
                  <View style={styles.listXPWrap}>
                    <Text style={[styles.listXP, isMe && { color: Palette.pawGold }]}>
                      {entry.period_xp}
                    </Text>
                    <Text style={styles.listXPLabel}>XP</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
  },
  backText: { color: C.text, fontSize: 18, fontWeight: "600" },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: "700" },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.surface,
    borderRadius: Radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  tabActive: { backgroundColor: Palette.pawGold },
  tabText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: Palette.questNight, fontWeight: "700" },

  // Loading
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: C.text, fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { color: C.textSecondary, fontSize: 14, textAlign: "center" },

  // Podium
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
    height: 260,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
  },
  podiumCrown: { fontSize: 24, marginBottom: 4 },
  podiumEmoji: { fontSize: 32, marginBottom: 6 },
  podiumName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
    maxWidth: 90,
  },
  podiumXP: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  podiumBar: {
    width: "80%",
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 12,
  },
  podiumBar1: {
    height: 120,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    borderBottomWidth: 0,
  },
  podiumBar2: {
    height: 90,
    backgroundColor: "rgba(192,192,192,0.12)",
    borderWidth: 1,
    borderColor: "rgba(192,192,192,0.25)",
    borderBottomWidth: 0,
  },
  podiumBar3: {
    height: 70,
    backgroundColor: "rgba(205,127,50,0.12)",
    borderWidth: 1,
    borderColor: "rgba(205,127,50,0.25)",
    borderBottomWidth: 0,
  },
  podiumMedal: { fontSize: 28 },

  // My rank card
  myRankCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(250,199,117,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,199,117,0.25)",
    borderRadius: Radius.lg,
    padding: 14,
  },
  myRankLabel: {
    color: Palette.pawGold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  myRankRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  myRankNum: { color: Palette.pawGold, fontSize: 24, fontWeight: "800", minWidth: 40 },
  myRankInfo: { flex: 1 },
  myRankName: { color: C.text, fontSize: 16, fontWeight: "700" },
  myRankBreed: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  myRankXPWrap: { alignItems: "flex-end" },
  myRankXP: { color: Palette.pawGold, fontSize: 20, fontWeight: "800" },
  myRankXPLabel: { color: C.textSecondary, fontSize: 10 },

  // List
  listSection: { paddingHorizontal: 20 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  listRowMe: {
    backgroundColor: "rgba(250,199,117,0.06)",
    borderColor: "rgba(250,199,117,0.2)",
  },
  listRank: {
    color: C.textSecondary,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
  listAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(250,199,117,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  listInfo: { flex: 1 },
  listName: { color: C.text, fontSize: 14, fontWeight: "600" },
  listMeta: { color: C.textSecondary, fontSize: 11, marginTop: 2 },
  listXPWrap: { alignItems: "flex-end" },
  listXP: { color: C.text, fontSize: 16, fontWeight: "700" },
  listXPLabel: { color: C.textSecondary, fontSize: 10 },
});
