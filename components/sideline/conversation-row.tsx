import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { isOpenable, statusLabel } from "@/lib/calls/grouping";
import { formatClockTime } from "@/lib/format";
import type { LocalRecording } from "@/lib/recording/types";

export interface ConversationRowProps {
  recording: LocalRecording;
  onOpen: () => void;
  onRetry: () => void;
}

/**
 * A single call in the history feed: title, then when it was recorded.
 *
 * No owner line: every call on this phone is the signed-in rep's own, and
 * printing their name on each of their own rows says nothing. The date comes
 * from the section heading, so the meta line carries the time only.
 */
export function ConversationRow({
  recording,
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
      accessibilityLabel={`${recording.name}, recorded at ${formatClockTime(
        recording.startedAt,
      )}`}
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
        <Text variant="rowTitle" numberOfLines={1}>
          {recording.name}
        </Text>
        <Text variant="label" tone="muted" numberOfLines={1}>
          {formatClockTime(recording.startedAt)}
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
  status: { marginTop: 2 },
});
