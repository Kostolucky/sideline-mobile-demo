import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/constants/tokens";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { AccountSheet } from "@/components/sideline/account-sheet";
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

/** Initials for the header avatar, derived from the account email. */
function initialsFrom(email: string | undefined): string {
  if (!email) return "?";
  const [local] = email.split("@");
  const parts = local.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

/**
 * Home — the call history feed. The list is the root of the app, and recording
 * starts from the floating button, which begins capture immediately with no
 * setup step.
 *
 * Production polls every 20 seconds while focused because there is no push
 * channel. The demo store notifies subscribers the instant anything changes, so
 * there is nothing to poll for — the one thing that genuinely arrives late is
 * the scripted coaching message, which is what the timer below is for.
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, membership } = useSession();
  const state = useDemoState();

  const [refreshing, setRefreshing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
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
      const viewerIsAdmin =
        state.members.find((m) => m.userId === state.personaId)?.role === "admin";
      injectIncomingComment(
        callId,
        viewerIsAdmin ? REP_PERSON_ID : ADMIN_PERSON_ID,
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
      {/* Compact header — sits inside the feed rather than above it as a banner.
          The scope switch lives in this band, which is outside the ScrollView, so
          the current view stays legible while the feed scrolls. */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <Text variant="wordmark" tone="brand">
            Sideline
          </Text>
          <PressableScale
            onPress={() => setAccountOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
            style={styles.avatarTarget}
          >
            <View style={styles.avatar}>
              <Text variant="meta" style={styles.avatarText}>
                {initialsFrom(session?.user.email)}
              </Text>
            </View>
          </PressableScale>
        </View>

        {isAdmin ? (
          <View style={styles.scopeRow}>
            <ScopeSwitch value={scope} onChange={setScope} />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 120 },
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

      <PressableScale
        onPress={() => router.push("/record")}
        accessibilityRole="button"
        accessibilityLabel="Start new sales call"
        style={[styles.fab, { bottom: Math.max(spacing["2xl"], insets.bottom) }]}
      >
        <Ionicons name="add" size={30} color={colors.brandForeground} />
      </PressableScale>

      {accountOpen ? (
        <AccountSheet
          onClose={() => setAccountOpen(false)}
          onRequestSignOut={() => {
            setAccountOpen(false);
            setConfirmSignOut(true);
          }}
        />
      ) : null}

      {confirmSignOut ? (
        <ConfirmDialog
          title="Sign out?"
          description="You'll need to sign in again to record calls."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={() => {
            setConfirmSignOut(false);
            router.push("/sign-in");
          }}
          onCancel={() => setConfirmSignOut(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scopeRow: { marginTop: spacing.md },
  avatarTarget: {
    width: 44,
    height: 44,
    marginVertical: -4,
    marginRight: -4,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "600" },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  group: { marginBottom: spacing["2xl"] },
  groupHeading: { marginBottom: 10, paddingHorizontal: 2 },
  groupItems: { gap: spacing.sm },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: 80 },
  emptyText: { textAlign: "center", maxWidth: 260 },
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
});
