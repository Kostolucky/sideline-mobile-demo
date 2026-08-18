import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "@/constants/tokens";
import { Text } from "@/components/ui/text";
import { AppHeader } from "@/components/sideline/app-header";
import { HomeFooter, homeFooterPadding } from "@/components/sideline/home-footer";
import { ConversationRow } from "@/components/sideline/conversation-row";
import { groupByDate } from "@/lib/calls/grouping";
import { useDemoState } from "@/lib/demo/use-demo";
import { updateRecording } from "@/lib/demo/store";
import { runRecordingPipeline } from "@/lib/demo/pipeline";
import { TIMINGS } from "@/lib/demo/timings";
import type { LocalRecording } from "@/lib/recording/types";

/**
 * Calls — the rep's own call history, and the app's only destination.
 *
 * Everything on this screen belongs to the person holding the phone: there is
 * no scope switch, no rep filter and no way to reach anyone else's work. That
 * lives on the web, where a manager reviews a team. Here the feed is simply
 * "what I recorded", and what sits at the bottom is what you do next — record
 * something. See `HomeFooter`.
 */
export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useDemoState();

  const [refreshing, setRefreshing] = useState(false);

  const groups = useMemo(() => groupByDate(state.recordings), [state.recordings]);

  const onRefresh = useCallback(() => {
    // Nothing to fetch — but a pull that snaps back instantly reads as broken,
    // so the spinner is held briefly.
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), TIMINGS.refreshMs);
  }, []);

  function onRetry(recording: LocalRecording) {
    // Both failure states resolve the same way here: put the row back into the
    // pipeline and let it run through to ready.
    updateRecording(recording.id, {
      uploadState: "queued",
      recordingState: "stopped",
      lastError: null,
      retryCount: recording.retryCount + 1,
    });
    runRecordingPipeline(recording.id);
  }

  return (
    <View style={styles.fill}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: homeFooterPadding(insets.bottom) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="mic-outline"
              size={30}
              color={colors.mutedForeground}
            />
            <Text variant="body" tone="muted" style={styles.emptyText}>
              Your recorded calls will appear here.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.dateKey} style={styles.group}>
              <Text variant="label" tone="muted" style={styles.groupHeading}>
                {group.dateLabel}
              </Text>
              <View style={styles.groupItems}>
                {group.items.map((recording) => (
                  <ConversationRow
                    key={recording.id}
                    recording={recording}
                    onOpen={() => router.push(`/call/${recording.conversationId}`)}
                    onRetry={() => onRetry(recording)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <HomeFooter onNew={() => router.push("/record")} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  group: { marginBottom: spacing["2xl"] },
  groupHeading: { marginBottom: 10, paddingHorizontal: 2 },
  groupItems: { gap: spacing.sm },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: 80 },
  emptyText: { textAlign: "center", maxWidth: 260 },
});
