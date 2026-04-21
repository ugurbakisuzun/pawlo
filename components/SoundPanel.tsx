import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Palette, Radius } from "../constants/theme";
import { playClicker, playWhistle } from "../lib/sounds";

const C = Colors.light;

/**
 * Floating bottom-right widget with two training tools — clicker + whistle.
 * Renders absolute-positioned over its parent. Drop into any screen that
 * benefits from quick access during a training session.
 */
export function SoundPanel() {
  const onClicker = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playClicker();
  };
  const onWhistle = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playWhistle();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.panel}>
        <TouchableOpacity style={styles.btn} onPress={onClicker} activeOpacity={0.7}>
          <Text style={styles.icon}>🐾</Text>
          <Text style={styles.label}>Click</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.btn} onPress={onWhistle} activeOpacity={0.7}>
          <Text style={styles.icon}>🎺</Text>
          <Text style={styles.label}>Whistle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 14,
    bottom: Platform.OS === "ios" ? 32 : 18,
    zIndex: 50,
  },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  icon: { fontSize: 16 },
  label: { color: C.text, fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: C.border,
  },
});
