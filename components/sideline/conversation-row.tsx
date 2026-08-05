import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { isOpenable, statusLabel } from "@/lib/calls/grouping";
import { formatClockTime } from "@/lib/format";
import type { LocalRecording } from "@/lib/recording/types";

export interface ConversationRowProps {
  recording: LocalRecording;
  /** Full name of whoever recorded it — shown on every row, including your own. */
  repName: string;
  /** Coaching messages the signed-in person hasn't seen on this call. */
  unreadCoaching?: number;
  onOpen: () => void;
  onRetry: () => void;
}

/**
 * A single call in the history feed: title, then who recorded it and when.
 *
 * The owner line is unconditional. Once an Admin can see the whole workspace, a
 * row without a name is ambiguous — and showing it only on other people's calls
 * would make the two roles read differently for no good reason. The date comes
 * from the section heading, so the meta line carries the time only.
 */
export function ConversationRow({
  recording,
  repName,
  unreadCoaching = 0,
  onOpen,
  onRetry,
}: ConversationRowProps) {
  const status = statusLabel(recording);
  const openable = isOpenable(recording);
  const retryable =
    recording.uploadState === "upload_failed" ||
    recording.uploadState === "processing_failed" ||
    recording.recordingState === "interrupted";

  const interactive = openable || retryable;

  return (
    <PressableScale
      onPress={openable ? onOpen : retryable ? onRetry : () => {}}
      disabled={!interactive}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCoaching > 0
          ? `${recording.name}, recorded by ${repName}, ${unreadCoaching} unread coaching ${
              unreadCoaching === 1 ? "message" : "messages"
            }`
          : `${recording.name}, recorded by ${repName}`
      }
      accessibilityHint={
        openable
          ? "Opens the call"
          : retryable
            ? "Retries the failed step"
            : undefined
      }
      style={styles.row}
    >
      <View style={styles.content}>
        {/* The badge shares the title line so it stays pinned to this call and
            can't be mistaken for a row of its own. */}
        <View style={styles.titleLine}>
          <Text variant="rowTitle" numberOfLines={1} style={styles.title}>
            {recording.name}
          </Text>
          {unreadCoaching > 0 ? (
            <View style={styles.badge}>
              <Text variant="meta" tone="onBrand" tabular style={styles.badgeText}>
                {unreadCoaching > 9 ? "9+" : unreadCoaching}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="label" tone="muted" numberOfLines={1}>
          {repName} · {formatClockTime(recording.startedAt)}
        </Text>
        {status ? (
          <Text
            variant="meta"
            tone={retryable ? "destructive" : "muted"}
            style={styles.status}
            numberOfLines={1}
          >
            {status}
          </Text>
        ) : null}
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
  status: { marginTop: 2 },
});
