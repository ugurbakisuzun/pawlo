import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Palette, Radius, Spacing } from "../constants/theme";
import { Badge, getRarityColor, useStore } from "../lib/store";

const C = Colors.dark;

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "session", label: "Sessions" },
  { id: "streak", label: "Streaks" },
  { id: "trick", label: "Tricks" },
  { id: "level", label: "Levels" },
  { id: "xp", label: "XP" },
];

export default function BadgesScreen() {
  const { dog, allBadges, earnedBadgeIds, loadBadges } = useStore();
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (dog) loadBadges(dog.id);
  }, [dog?.id]);

  const filtered =
    selectedCategory === "all"
      ? allBadges
      : allBadges.filter((b) => b.category === selectedCategory);

  const earnedCount = allBadges.filter((b) => earnedBadgeIds.includes(b.id)).length;
  const totalXPEarned = allBadges
    .filter((b) => earnedBadgeIds.includes(b.id))
    .reduce((sum, b) => sum + b.xp_reward, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badges</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{earnedCount}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{allBadges.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: Palette.pawGold }]}>{totalXPEarned}</Text>
          <Text style={styles.statLabel}>Bonus XP</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Badge grid */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.listScroll}>
        {filtered.map((badge) => {
          const earned = earnedBadgeIds.includes(badge.id);
          const rarityColor = getRarityColor(badge.rarity);
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                earned && { borderColor: rarityColor + "50" },
                !earned && styles.badgeCardLocked,
              ]}
            >
              <View style={[styles.badgeIconWrap, { backgroundColor: earned ? rarityColor + "15" : C.surface }]}>
                <Text style={[styles.badgeIcon, !earned && { opacity: 0.25 }]}>
                  {badge.emoji}
                </Text>
              </View>
              <View style={styles.badgeInfo}>
                <View style={styles.badgeNameRow}>
                  <Text style={[styles.badgeName, !earned && { color: C.textMuted }]}>
                    {badge.name}
                  </Text>
                  {earned && (
                    <View style={[styles.rarityPill, { backgroundColor: rarityColor + "25" }]}>
                      <Text style={[styles.rarityText, { color: rarityColor }]}>
                        {badge.rarity}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeDesc, !earned && { color: C.textMuted }]}>
                  {badge.description}
                </Text>
                {earned ? (
                  <Text style={styles.badgeEarned}>Earned · +{badge.xp_reward} XP</Text>
                ) : (
                  <Text style={styles.badgeProgress}>
                    {badge.trigger_type === "session_count" && `Complete ${badge.trigger_value} sessions`}
                    {badge.trigger_type === "streak_days" && `${badge.trigger_value}-day streak needed`}
                    {badge.trigger_type === "trick_count" && `Complete ${badge.trigger_value} tricks`}
                    {badge.trigger_type === "level_reach" && `Reach Level ${badge.trigger_value}`}
                    {badge.trigger_type === "xp_total" && `Earn ${badge.trigger_value.toLocaleString()} XP`}
                  </Text>
                )}
              </View>
              {earned ? (
                <Text style={styles.earnedCheck}>✓</Text>
              ) : (
                <Text style={styles.lockedIcon}>🔒</Text>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
  },
  backText: { color: C.text, fontSize: 18, fontWeight: "600" },
  headerTitle: { color: C.text, fontSize: 20, fontWeight: "700" },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: "center",
  },
  statNum: { color: C.text, fontSize: 24, fontWeight: "800" },
  statLabel: { color: C.textSecondary, fontSize: 11, marginTop: 2 },

  // Filter
  filterScroll: { flexGrow: 0, marginBottom: 16 },
  filterChip: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: Palette.pawGold,
    borderColor: Palette.pawGold,
  },
  filterChipText: { color: C.textSecondary, fontSize: 13, fontWeight: "500" },
  filterChipTextActive: { color: Palette.questNight, fontWeight: "700" },

  // List
  listScroll: { flex: 1, paddingHorizontal: 20 },

  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  badgeCardLocked: { opacity: 0.6 },
  badgeIconWrap: {
    width: 52, height: 52, borderRadius: Radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  badgeIcon: { fontSize: 28 },
  badgeInfo: { flex: 1 },
  badgeNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  badgeName: { color: C.text, fontSize: 15, fontWeight: "600" },
  rarityPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rarityText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" as any },
  badgeDesc: { color: C.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  badgeEarned: { color: Palette.streakGreen, fontSize: 11, fontWeight: "600" },
  badgeProgress: { color: C.textMuted, fontSize: 11 },
  earnedCheck: { color: Palette.streakGreen, fontSize: 20, fontWeight: "700" },
  lockedIcon: { fontSize: 16 },
});
