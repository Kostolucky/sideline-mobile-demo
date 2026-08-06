import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, spacing } from "@/constants/tokens";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { AccountSheet } from "@/components/sideline/account-sheet";
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
 * Extracted when Coaching became a second primary screen — both need the same
 * chrome, and the account sheet brings enough state with it (sheet visibility,
 * the sign-out confirmation, the persona switch) that duplicating it across two
 * screens would have been the start of a drift problem.
 *
 * `children` renders inside the band, below the wordmark row. The Calls screen
 * puts the Admin scope switch there so it stays legible while the feed scrolls
 * underneath.
 */
export function AppHeader({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();

  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <>
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

        {children ? <View style={styles.slot}>{children}</View> : null}
      </View>

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
    </>
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
