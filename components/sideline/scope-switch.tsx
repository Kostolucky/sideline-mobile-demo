import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import type { FeedScope } from "@/lib/calls/scope";

const OPTIONS: { value: FeedScope; label: string }[] = [
  { value: "all", label: "All Calls" },
  { value: "mine", label: "My Calls" },
];

/**
 * Admin-only two-way switch between the whole workspace and just your own calls.
 *
 * A filled green pill marks the selection, so it survives a glance rather than
 * relying on a subtle weight change. Lives in the fixed header band above the
 * scroll view, which keeps the current view legible while the feed scrolls.
 * Deliberately just two options — no rep, date, or search filters.
 */
export function ScopeSwitch({
  value,
  onChange,
}: {
  value: FeedScope;
  onChange: (next: FeedScope) => void;
}) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            activeScale={0.97}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text
              variant="label"
              tone={selected ? "onBrand" : "muted"}
              style={styles.optionText}
            >
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    padding: 3,
    gap: 3,
  },
  option: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  optionSelected: { backgroundColor: colors.brand },
  optionText: { fontWeight: "600" },
});
