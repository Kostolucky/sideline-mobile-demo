import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, spacing } from "@/constants/tokens";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useSession } from "@/lib/auth";
import { resetDemo } from "@/lib/demo/store";

/** Initials for the avatar, derived from the account email. */
function initialsFrom(email: string | undefined): string {
  if (!email) return "?";
  const [local] = email.split("@");
  const parts = local.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

/**
 * Account — a full screen on the root stack, not a sheet.
 *
 * It used to be a bottom sheet rendered inside whichever list screen you were
 * on, which put it in the same stacking context as that screen's ScrollView —
 * so the list painted straight over it. A pushed screen has no such problem,
 * and it also means the bottom navigation is correctly absent here: this is a
 * detour out of the app's primary actions, not one of them.
 *
 * There is no "viewing as" control: this app is one rep's workspace and has no
 * second role to switch into.
 */
export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const name = session?.user.name ?? "—";
  const email = session?.user.email ?? "—";

  return (
    <View style={styles.fill}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <IconButton
          name="chevron-back"
          onPress={() => router.back()}
          accessibilityLabel="Back"
          variant="secondary"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + spacing["3xl"] },
        ]}
      >
        <Text variant="title" style={styles.title}>
          Account
        </Text>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="subheading" tone="onBrand">
              {initialsFrom(session?.user.email)}
            </Text>
          </View>
          <View style={styles.identityText}>
            <Text variant="subheading" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="label" tone="muted" numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <PressableScale
            onPress={() => {
              resetDemo();
              router.back();
            }}
            accessibilityRole="button"
            style={styles.reset}
          >
            <Text variant="control" tone="muted">
              Reset demo data
            </Text>
          </PressableScale>
          <Text variant="meta" tone="muted" style={styles.sectionNote}>
            Restores the original sample data. Everything lives in memory, so
            relaunching the app does the same thing.
          </Text>
        </View>

        <PressableScale
          onPress={() => setConfirmSignOut(true)}
          accessibilityRole="button"
          style={styles.signOut}
        >
          <Text variant="control" tone="destructive">
            Sign out
          </Text>
        </PressableScale>

        <Text variant="meta" tone="muted" style={styles.footnote}>
          Sample data only — no sign-in, no backend, no customer information.
        </Text>
      </ScrollView>

      {confirmSignOut ? (
        <ConfirmDialog
          title="Sign out?"
          description="You'll need to sign in again to record calls."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={() => {
            setConfirmSignOut(false);
            router.replace("/sign-in");
          }}
          onCancel={() => setConfirmSignOut(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingBottom: 4 },
  body: { paddingHorizontal: spacing["2xl"], paddingTop: spacing.sm },
  title: { marginBottom: spacing.xl },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1, gap: 2 },
  section: { marginTop: spacing["3xl"], gap: spacing.sm },
  sectionNote: { lineHeight: 16 },
  reset: {
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  signOut: {
    marginTop: spacing["3xl"],
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230,67,67,0.12)",
  },
  footnote: { marginTop: spacing.xl, textAlign: "center", lineHeight: 16 },
});
