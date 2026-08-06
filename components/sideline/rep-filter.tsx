import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/constants/tokens";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import {
  repFilterOptions,
  repFilterLabel,
  selectionKey,
  type RepOption,
  type RepSelection,
} from "@/lib/calls/rep-filter";

/**
 * Admin-only rep filter for the Calls feed.
 *
 * A trigger chip that opens a bottom sheet, rather than a segmented control:
 * there are six choices here and they grow with the team, which is more than a
 * row of pills can hold on a phone. The trigger always names the current
 * selection so the feed is never silently filtered.
 *
 * The options come from the members passed in — the centralised people list —
 * so adding a rep to the fixtures adds them here with no change to this file.
 *
 * The trigger and its sheet live together in one component, and `BottomSheet`
 * renders through a native overlay, so this can sit inside the header band
 * without the feed painting over the open sheet.
 */
export function RepFilter({
  selection,
  onChange,
  members,
  currentUserId,
  namesByUserId,
}: {
  selection: RepSelection;
  onChange: (next: RepSelection) => void;
  members: RepOption[];
  currentUserId: string;
  namesByUserId: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  const options = repFilterOptions(members, currentUserId);
  const activeKey = selectionKey(selection);
  const label = repFilterLabel(selection, namesByUserId);

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        activeScale={0.97}
        accessibilityRole="button"
        accessibilityLabel={`Filter by rep. Showing ${label}`}
        accessibilityHint="Opens the rep filter"
        style={styles.trigger}
      >
        <Ionicons
          name="people-outline"
          size={16}
          color={colors.mutedForeground}
        />
        <Text variant="label" style={styles.triggerText} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={colors.mutedForeground}
        />
      </PressableScale>

      {open ? (
        <BottomSheet onClose={() => setOpen(false)} closeLabel="Close rep filter">
          <Text variant="sectionLabel" tone="muted" style={styles.sheetHeading}>
            Show calls from
          </Text>
          {/* Bounded so a large team scrolls instead of pushing the sheet off
              the top of the screen. */}
          <ScrollView style={styles.sheetList} bounces={false}>
            {options.map((option) => {
              const active = option.key === activeKey;
              return (
                <PressableScale
                  key={option.key}
                  activeScale={0.98}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChange(option.selection);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  <Text
                    variant="control"
                    tone={active ? "brand" : "default"}
                    numberOfLines={1}
                    style={styles.optionText}
                  >
                    {option.label}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.brand}
                    />
                  ) : null}
                </PressableScale>
              );
            })}
          </ScrollView>
        </BottomSheet>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    height: 38,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  triggerText: { fontWeight: "600", flexShrink: 1 },
  sheetHeading: { marginBottom: spacing.sm },
  sheetList: { maxHeight: 320 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    height: 52,
    paddingHorizontal: spacing.xs,
  },
  optionText: { flexShrink: 1 },
});
