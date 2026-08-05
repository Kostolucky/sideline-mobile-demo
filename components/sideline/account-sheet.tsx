import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/tokens";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

/**
 * Account bottom sheet, opened from the header avatar.
 *
 * Production shows identity and a sign-out. The demo adds the persona switch,
 * which is the one control here with no production equivalent — and the most
 * useful one in a sales demo, because the permission model is a big part of
 * what Sideline sells. An Admin sees every call in the workspace and gets the
 * All / My Calls switch on the feed; a User sees only their own, and replies to
 * coaching rather than starting it.
 */
export function AccountSheet({
  onClose,
  onRequestSignOut,
}: {
  onClose: () => void;
  onRequestSignOut: () => void;
}) {
  const { session, membership, setPersonaId, personaIds } = useSession();
  const email = session?.user.email ?? "—";
  const role = membership?.role ?? "member";

  const options = [
    { id: personaIds.admin, label: "Admin" },
    { id: personaIds.rep, label: "User" },
  ];

  return (
    <BottomSheet onClose={onClose} closeLabel="Close account menu">
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

      <View style={styles.personaBlock}>
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
                style={[styles.personaOption, selected && styles.personaSelected]}
              >
                <Text variant="label" tone={selected ? "onBrand" : "muted"}>
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text variant="meta" tone="muted">
          Sample data only — no sign-in, no backend, no customer information.
        </Text>
      </View>

      <PressableScale
        onPress={() => {
          resetDemo();
          onClose();
        }}
        accessibilityRole="button"
        style={styles.reset}
      >
        <Text variant="control" tone="muted">
          Reset demo data
        </Text>
      </PressableScale>

      <PressableScale
        onPress={onRequestSignOut}
        accessibilityRole="button"
        style={styles.signOut}
      >
        <Text variant="control" tone="destructive">
          Sign out
        </Text>
      </PressableScale>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1, gap: 2 },
  personaBlock: { marginTop: spacing["2xl"], gap: spacing.sm },
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
    marginTop: spacing.xl,
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  signOut: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230,67,67,0.12)",
  },
});
