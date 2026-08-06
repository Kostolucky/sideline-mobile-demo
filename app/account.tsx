import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, spacing } from "@/constants/tokens";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useSession, type MemberRole } from "@/lib/auth";
import { resetDemo } from "@/lib/demo/store";

/** Two roles only, and the same words the web app uses. */
const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Admin",
  member: "User",
};

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
 * detour out of the app's three primary actions, not a fourth one.
 */
export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, membership, setPersonaId, personaIds } = useSession();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const email = session?.user.email ?? "—";
  const role = membership?.role ?? "member";

  const options = [
    { id: personaIds.admin, label: "Admin" },
    { id: personaIds.rep, label: "User" },
  ];

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
              {email}
            </Text>
            <Text variant="label" tone="muted">
              {ROLE_LABEL[role]} · Demo
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="sectionLabel" tone="muted">
            Viewing as
          </Text>
          <View style={styles.personaTrack}>
            {options.map((option) => {
              const selected = session?.user.id === option.id;
              return (
                <PressableScale
                  key={option.id}
                  activeScale={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setPersonaId(option.id)}
                  style={[
                    styles.personaOption,
                    selected && styles.personaSelected,
                  ]}
                >
                  <Text variant="label" tone={selected ? "onBrand" : "muted"}>
                    {option.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <Text variant="meta" tone="muted" style={styles.sectionNote}>
            An Admin sees every call in the workspace and can start coaching
            threads. A User sees only the calls they recorded, and replies to
            coaching rather than opening it.
          </Text>
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
  personaTrack: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    padding: 3,
    gap: 3,
  },
  personaOption: {
    flex: 1,
    height: 38,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  personaSelected: { backgroundColor: colors.brand },
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
