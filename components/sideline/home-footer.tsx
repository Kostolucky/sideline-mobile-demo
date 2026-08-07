import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, type } from "@/constants/tokens";
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
 * The home footer: an ask field and a new-recording button.
 *
 * This replaced the three-option tab bar. Calls is the only destination the app
 * has — coaching lives inside a call, next to the transcript it is about — so a
 * tab bar was navigating between one place and a screen that duplicated it.
 * What belongs at the bottom of a list is what you do next: ask something, or
 * capture something.
 *
 * The field is inert for now. The `+` starts a recording, which is what "new"
 * means here, and keeps the brand green the old floating button had.
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
      <View style={styles.field}>
        <TextInput
          editable={false}
          placeholder="Ask anything"
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Ask anything"
          style={styles.input}
        />
        <View style={styles.mic}>
          <Ionicons name="mic" size={16} color={colors.mutedForeground} />
        </View>
      </View>

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
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: CONTROL_HEIGHT,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.foreground,
    // The field is not yet wired to anything, so it must not take focus and
    // raise a keyboard over a screen that can't answer.
    paddingVertical: 0,
  },
  mic: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
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
