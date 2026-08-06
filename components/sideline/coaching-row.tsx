import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { relativeTime, type CoachingInboxItem } from "@/lib/calls/coaching-inbox";

/**
 * One conversation in the Coaching inbox.
 *
 * Reads like a messaging app row — who it's with, what was said last, when, and
 * whether anything is unread — while keeping the feed's card shape so the two
 * lists look like the same product. Purely presentational: the navigation
 * target is decided by the screen, not in here.
 */
export function CoachingRow({
  item,
  onOpen,
}: {
  item: CoachingInboxItem;
  onOpen: () => void;
}) {
  const unread = item.unread > 0;
  // "You: " matches how every messaging app disambiguates the last speaker.
  const preview = item.lastMessageMine ? `You: ${item.preview}` : item.preview;

  return (
    <PressableScale
      onPress={onOpen}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={
        unread
          ? `${item.callName}, ${item.unread} unread coaching ${
              item.unread === 1 ? "message" : "messages"
            }`
          : `${item.callName}, coaching conversation`
      }
      accessibilityHint="Opens the call's coaching thread"
      style={styles.row}
    >
      <View style={styles.content}>
        <View style={styles.titleLine}>
          <Text variant="rowTitle" numberOfLines={1} style={styles.title}>
            {item.callName}
          </Text>
          <Text variant="meta" tone="muted" style={styles.time}>
            {relativeTime(item.lastMessageAt)}
          </Text>
        </View>

        {item.otherPartyName ? (
          <Text variant="label" tone="muted" numberOfLines={1}>
            {item.otherPartyName}
          </Text>
        ) : null}

        <View style={styles.previewLine}>
          <Text
            variant="label"
            tone={unread ? "default" : "muted"}
            numberOfLines={2}
            style={[styles.preview, unread && styles.previewUnread]}
          >
            {preview}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text variant="meta" tone="onBrand" tabular style={styles.badgeText}>
                {item.unread > 9 ? "9+" : item.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  content: { gap: 3 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { flexShrink: 1 },
  time: { marginLeft: "auto" },
  previewLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: 4,
  },
  preview: { flexShrink: 1, lineHeight: 20 },
  previewUnread: { fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontWeight: "700" },
});
