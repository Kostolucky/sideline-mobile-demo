import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useSession } from "@/lib/auth";

/** Initials for the header avatar, derived from the account email. */
function initialsFrom(email: string | undefined): string {
  if (!email) return "?";
  const [local] = email.split("@");
  const parts = local.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

/**
 * The charcoal band at the top of every primary screen: wordmark on the left,
 * account avatar on the right.
 *
 * The avatar pushes the Account screen. It used to open a bottom sheet from
 * here, which rendered inside the host screen and therefore in the same
 * stacking context as that screen's ScrollView — the list painted straight over
 * it. Navigating sidesteps that entirely, and Account gets a back arrow and no
 * bottom navigation, which is the right shape for a detour out of the app's
 * three primary actions.
 *
 * `children` renders inside the band, below the wordmark row. The Calls screen
 * puts the Admin scope switch there so it stays legible while the feed scrolls
 * underneath.
 */
export function AppHeader({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.headerRow}>
        <Text variant="wordmark" tone="brand">
          Sideline
        </Text>
        <PressableScale
          onPress={() => router.push("/account")}
          accessibilityRole="button"
          accessibilityLabel="Account"
          style={styles.avatarTarget}
        >
          <View style={styles.avatar}>
            <Text variant="meta" style={styles.avatarText}>
              {initialsFrom(session?.user.email)}
            </Text>
          </View>
        </PressableScale>
      </View>

      {children ? <View style={styles.slot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  slot: { marginTop: spacing.md },
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
});
