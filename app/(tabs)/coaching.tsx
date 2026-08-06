import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/constants/tokens";
import { Text } from "@/components/ui/text";
import { AppHeader } from "@/components/sideline/app-header";
import { bottomNavPadding } from "@/components/sideline/bottom-nav";
import { CoachingRow } from "@/components/sideline/coaching-row";
import { useSession } from "@/lib/auth";
import { buildCoachingInbox } from "@/lib/calls/coaching-inbox";
import { useDemoState } from "@/lib/demo/use-demo";
import {
  namesByUserId,
  unreadCoachingCounts,
  visibleRecordings,
} from "@/lib/demo/store";

/**
 * Coaching — an inbox of the calls that have a coaching conversation on them.
 *
 * Deliberately a list, not a chat. The thread itself already lives on the call
 * detail screen's Coaching pane, next to the transcript and the recording it's
 * about; duplicating it here would mean coaching about a moment you can't play.
 * So a row opens the call and lands directly on that pane.
 */
export default function CoachingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, membership } = useSession();
  const state = useDemoState();

  const items = useMemo(() => {
    if (!session) return [];
    // Scoped to what this persona can see, so a User never sees coaching on
    // someone else's call.
    const calls = visibleRecordings(state)
      .filter((r) => r.conversationId)
      .map((r) => state.calls[r.conversationId as string])
      .filter((c) => !!c)
      .map((c) => ({ id: c.id, name: c.name, recordedBy: c.recorded_by }));

    return buildCoachingInbox({
      calls,
      comments: state.comments,
      viewerId: session.user.id,
      namesByUserId: namesByUserId(state),
      unreadByCall: unreadCoachingCounts(state),
    });
  }, [state, session]);

  const isAdmin = membership?.role === "admin";

  return (
    <View style={styles.fill}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomNavPadding(insets.bottom) },
        ]}
      >
        <Text variant="label" tone="muted" style={styles.heading}>
          Coaching
        </Text>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color={colors.mutedForeground}
              />
            </View>
            <Text variant="subheading">No coaching yet</Text>
            <Text variant="body" tone="muted" style={styles.emptyText}>
              {isAdmin
                ? "Open a call and leave feedback for a rep. Conversations you start will show up here."
                : "When your manager leaves feedback on one of your calls, the conversation will appear here."}
            </Text>
          </View>
        ) : (
          <View style={styles.items}>
            {items.map((item) => (
              <CoachingRow
                key={item.callId}
                item={item}
                // Straight to the Coaching pane — the reason you tapped.
                onOpen={() =>
                  router.push({
                    pathname: "/call/[id]",
                    params: { id: item.callId, initialTab: "coaching" },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  heading: { marginBottom: 10, paddingHorizontal: 2 },
  items: { gap: spacing.sm },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: 72 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyText: { textAlign: "center", maxWidth: 280 },
});
