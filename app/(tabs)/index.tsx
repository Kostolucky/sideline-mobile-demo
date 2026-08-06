import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "@/constants/tokens";
import { Text } from "@/components/ui/text";
import { AppHeader } from "@/components/sideline/app-header";
import { bottomNavPadding } from "@/components/sideline/bottom-nav";
import { ConversationRow } from "@/components/sideline/conversation-row";
import { ScopeSwitch } from "@/components/sideline/scope-switch";
import { filterByScope, type FeedScope } from "@/lib/calls/scope";
import { useSession } from "@/lib/auth";
import { groupByDate } from "@/lib/calls/grouping";
import { useDemoState } from "@/lib/demo/use-demo";
import {
  injectIncomingComment,
  namesByUserId,
  unreadCoachingCounts,
  updateRecording,
  visibleRecordings,
} from "@/lib/demo/store";
import { runRecordingPipeline } from "@/lib/demo/pipeline";
import { TIMINGS } from "@/lib/demo/timings";
import { ADMIN_PERSON_ID, REP_PERSON_ID } from "@/lib/demo/content";
import type { LocalRecording } from "@/lib/recording/types";

/**
 * Calls — the call history feed, and the app's landing screen.
 *
 * Recording used to start from a floating button on this screen; it now lives
 * in the persistent bottom navigation, so the FAB is gone and the list simply
 * pads itself clear of the nav.
 */
export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, membership } = useSession();
  const state = useDemoState();

  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<FeedScope>("all");

  // Only an Admin can see anyone else's calls, so only an Admin has anything to
  // switch between. A User's feed is already just their own.
  const isAdmin = membership?.role === "admin";

  const recordings = visibleRecordings(state);
  const repNames = namesByUserId(state);
  const unreadCoaching = unreadCoachingCounts(state);

  // The scripted "a coaching message just arrived" moment, so an unread badge
  // visibly lands while someone is looking at the feed. Fires once per launch.
  const injected = useRef(false);
  useEffect(() => {
    const { enabled, afterMs, callId } = TIMINGS.incomingCoaching;
    if (!enabled || injected.current) return;
    const timer = setTimeout(() => {
      if (injected.current) return;
      injected.current = true;
      // Send it from whoever the viewer is NOT, so it always lands as unread.
      // When the viewer is an Admin the sender is the rep who actually recorded
      // THIS call — not a fixed person, or the inbox would show someone
      // replying on a colleague's call.
      const viewerIsAdmin =
        state.members.find((m) => m.userId === state.personaId)?.role === "admin";
      const callRep = state.calls[callId]?.recorded_by ?? REP_PERSON_ID;
      injectIncomingComment(
        callId,
        viewerIsAdmin ? callRep : ADMIN_PERSON_ID,
        viewerIsAdmin
          ? "Just re-listened to the ridge vent part — I'm going to use that framing on the Delgado appeal too. Thanks for flagging it."
          : "One more thing on this one: when the carrier calls back, lead with the test-square count rather than the photos. The number is what moves them.",
      );
    }, afterMs);
    return () => clearTimeout(timer);
    // Intentionally launch-scoped: re-running on every state change would keep
    // resetting the timer and the message would never arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(
    () => filterByScope(recordings, scope, !!isAdmin, session?.user.id),
    [recordings, scope, isAdmin, session?.user.id],
  );

  const groups = useMemo(() => groupByDate(visible), [visible]);

  /** Name shown on a row. Falls back rather than rendering a blank owner line. */
  const repNameFor = (userId: string): string =>
    repNames[userId] ??
    (userId === session?.user.id ? (session?.user.email ?? "You") : "Unknown");

  const emptyMessage = !isAdmin
    ? "Your recorded calls will appear here."
    : scope === "mine"
      ? "You have not recorded any calls yet."
      : "No calls have been recorded yet.";

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
      <AppHeader>
        {isAdmin ? <ScopeSwitch value={scope} onChange={setScope} /> : null}
      </AppHeader>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomNavPadding(insets.bottom) },
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
              {emptyMessage}
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
                    repName={repNameFor(recording.userId)}
                    // Unread is keyed by the server's call id; a row recorded on
                    // this device carries it on `conversationId`.
                    unreadCoaching={
                      unreadCoaching[recording.conversationId ?? recording.id]
                    }
                    onOpen={() => router.push(`/call/${recording.conversationId}`)}
                    onRetry={() => onRetry(recording)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
