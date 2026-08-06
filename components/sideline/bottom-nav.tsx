import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";

/**
 * Height of the bar itself, above the safe-area inset.
 *
 * Exported so screens can pad their scroll content by the same amount instead
 * of each guessing — see `bottomNavPadding`.
 */
export const BOTTOM_NAV_HEIGHT = 64;

/**
 * Bottom padding a scrollable screen needs so its last row clears the nav.
 * The extra breathing room matches the feed's existing bottom spacing.
 */
export function bottomNavPadding(insetBottom: number): number {
  return insetBottom + BOTTOM_NAV_HEIGHT + spacing["2xl"];
}

/**
 * The persistent three-option bottom navigation: Calls · Record · Coaching.
 *
 * Record is deliberately NOT a tab. It's an action that opens the existing
 * recording flow modally over whichever screen you were on, so ending or
 * discarding a recording returns you there. Making it a tab would give it a
 * navigation state it has no use for, and would leave a half-finished recording
 * sitting in a tab you could wander away from.
 *
 * Rendered as a custom `tabBar` for the Tabs navigator, so the two real tabs
 * keep their own state and switching between them can't stack duplicates.
 */
export function BottomNav({
  state,
  navigation,
  unread = 0,
}: BottomTabBarProps & {
  /** Unread coaching count for the badge. Supplied by the tabs layout. */
  unread?: number;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeRoute = state.routes[state.index]?.name;

  /**
   * `navigate` rather than `push`: returns to the existing screen instead of
   * stacking another copy when the same tab is tapped repeatedly.
   */
  function go(routeName: string) {
    if (activeRoute === routeName) return;
    navigation.navigate(routeName);
  }

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom, height: BOTTOM_NAV_HEIGHT + insets.bottom },
      ]}
      accessibilityRole="tablist"
    >
      <NavItem
        icon="list"
        inactiveIcon="list-outline"
        label="Calls"
        active={activeRoute === "index"}
        onPress={() => go("index")}
      />

      {/* Not a tab: pushed onto the ROOT stack, so it slides up over whichever
          tab you were on and returns you there when it closes. */}
      <RecordButton onPress={() => router.push("/record")} />

      <NavItem
        icon="chatbubble-ellipses"
        inactiveIcon="chatbubble-ellipses-outline"
        label="Coaching"
        active={activeRoute === "coaching"}
        badge={unread}
        onPress={() => go("coaching")}
      />
    </View>
  );
}

/**
 * Icon only — no caption.
 *
 * With just three destinations and a distinct shape for each, the labels were
 * repeating what the icons already said and crowding the bar. The name still
 * reaches screen readers through `accessibilityLabel`, so nothing is lost for
 * anyone who needs it. Icons are sized up to carry the target on their own.
 */
function NavItem({
  icon,
  inactiveIcon,
  label,
  active,
  badge = 0,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.94}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        badge > 0
          ? `${label}, ${badge} unread ${badge === 1 ? "message" : "messages"}`
          : label
      }
      style={styles.item}
    >
      <View>
        <Ionicons
          name={active ? icon : inactiveIcon}
          size={30}
          color={active ? colors.brand : colors.mutedForeground}
        />
        {badge > 0 ? (
          <View style={styles.badge}>
            <Text variant="meta" tone="onBrand" tabular style={styles.badgeText}>
              {badge > 9 ? "9+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

/**
 * The centre action. Raised out of the bar and filled with the brand green so
 * it reads as the primary thing on the screen — the same treatment the feed's
 * floating button had before the nav existed, and the same as the web app's
 * mobile bottom bar.
 */
function RecordButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.item}>
      <PressableScale
        onPress={onPress}
        activeScale={0.92}
        accessibilityRole="button"
        accessibilityLabel="Record a call"
        style={styles.record}
      >
        <Ionicons name="mic" size={26} color={colors.brandForeground} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    // Icons carry the bar on their own now, so they sit centred in it rather
    // than hanging from the top with a caption underneath.
    alignItems: "center",
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    left: 18,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    // Sits on the charcoal bar, so it needs a matching ring to read as raised.
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: { fontWeight: "700" },
  record: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    // Lifted above the bar, with a ring in the page colour so the overlap reads
    // as deliberate rather than as a clipping bug.
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.background,
  },
});
