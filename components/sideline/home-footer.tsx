import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";

/** Height of the footer's controls, above the safe-area inset. */
const CONTROL_HEIGHT = 56;

/**
 * Bottom padding a scrollable screen needs so its last row clears the footer.
 */
export function homeFooterPadding(insetBottom: number): number {
  return insetBottom + CONTROL_HEIGHT + spacing["3xl"];
}

/**
 * The home footer: a single button that starts a recording.
 *
 * This replaced the three-option tab bar. Calls is the only destination the app
 * has, so a tab bar was navigating between one place and screens that
 * duplicated it. What belongs at the bottom of a list is what you do next, and
 * on this screen there is exactly one thing: capture a call.
 *
 * It sat beside an "Ask anything" field for a while, but nothing answered it,
 * so it promised a conversation the app could not hold. The `+` keeps the brand
 * green the old floating button had.
 */
export function HomeFooter({ onNew }: { onNew: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(spacing.lg, insets.bottom) },
      ]}
    >
      <PressableScale
        onPress={onNew}
        accessibilityRole="button"
        accessibilityLabel="Record a call"
        style={styles.new}
      >
        <Ionicons name="add" size={28} color={colors.brandForeground} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    // The button keeps the right edge it held when the ask field sat beside it.
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  new: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
