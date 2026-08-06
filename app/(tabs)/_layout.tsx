import { Tabs } from "expo-router";

import { colors } from "@/constants/tokens";
import { BottomNav } from "@/components/sideline/bottom-nav";
import { useDemoState } from "@/lib/demo/use-demo";
import { unreadCoachingCounts, visibleRecordings } from "@/lib/demo/store";

/**
 * The two primary screens, behind one persistent bottom navigation.
 *
 * Only Calls and Coaching are tabs. Record is an action on the root stack that
 * the nav triggers directly — see `BottomNav`. Using a real Tabs navigator (as
 * opposed to swapping screens by hand) is what gives us per-tab state and
 * guarantees that bouncing between Calls and Coaching can never stack
 * duplicates.
 *
 * The unread count is resolved here rather than inside the nav, so the nav
 * stays a presentation component with no knowledge of the store.
 */
export default function TabsLayout() {
  const state = useDemoState();

  // Scoped to what this persona can actually see, so a User's badge never
  // counts coaching on someone else's call.
  const visibleCallIds = new Set(
    visibleRecordings(state)
      .map((r) => r.conversationId)
      .filter((id): id is string => !!id),
  );
  const counts = unreadCoachingCounts(state);
  const unread = Object.entries(counts).reduce(
    (sum, [callId, n]) => (visibleCallIds.has(callId) ? sum + n : sum),
    0,
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={(props) => <BottomNav {...props} unread={unread} />}
    >
      <Tabs.Screen name="index" options={{ title: "Calls" }} />
      <Tabs.Screen name="coaching" options={{ title: "Coaching" }} />
    </Tabs>
  );
}
