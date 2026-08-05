import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";

/**
 * The sign-in screen.
 *
 * Reachable but never enforced — the app opens straight onto the feed, and
 * "Sign out" in the account sheet lands here so the entry point can still be
 * shown. Tapping the button walks back into the app.
 *
 * DELIBERATE DEVIATION FROM PRODUCTION: production's sign-in is the one screen
 * that never got the design system — it still carries a hardcoded legacy blue
 * palette (#0B1220, #2563EB) predating `constants/tokens.ts`. Reproducing that
 * here would look like a bug in a demo whose whole point is how the product
 * looks, so this is rebuilt on the tokens. It is the single screen where the
 * demo does not match production pixel for pixel.
 */
export default function SignInScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function signIn() {
    setBusy(true);
    setTimeout(() => router.replace("/"), 600);
  }

  return (
    <SafeAreaView style={styles.fill}>
      <View style={styles.brandBlock}>
        <View style={styles.mark}>
          <Ionicons name="mic" size={34} color={colors.brandForeground} />
        </View>
        <Text variant="titleLarge" style={styles.title}>
          Sideline
        </Text>
        <Text variant="body" tone="muted" style={styles.subtitle}>
          Record your in-person sales conversations and get instant coaching.
        </Text>
      </View>

      <View style={styles.actionBlock}>
        <PressableScale
          onPress={signIn}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={styles.button}
        >
          {busy ? (
            <ActivityIndicator color={colors.brandForeground} />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={20}
                color={colors.brandForeground}
              />
              <Text variant="control" tone="onBrand">
                Continue with Google
              </Text>
            </>
          )}
        </PressableScale>

        <Text variant="meta" tone="muted" style={styles.footnote}>
          Demo build — no account required. Access is normally invite-only, and
          recording requires consent from everyone in the conversation.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: spacing["3xl"],
    paddingVertical: spacing["3xl"],
  },
  brandBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", maxWidth: 300 },
  actionBlock: { gap: spacing.lg },
  button: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
  },
  footnote: { textAlign: "center", lineHeight: 16 },
});
