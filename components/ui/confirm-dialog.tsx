import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { colors, radius, spacing } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";

export interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Centred confirmation modal, ported from the mockup. Replaces the platform
 * `Alert.alert` the old screens used — the mockup's flow needs a branded
 * surface, and Alert can't be styled.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(140)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={styles.scrim}
        />
      </Animated.View>

      <View style={styles.centre} pointerEvents="box-none">
        <Animated.View entering={ZoomIn.duration(180)} style={styles.dialog}>
          <Text variant="subheading" style={styles.centreText}>
            {title}
          </Text>
          {description ? (
            <Text variant="body" tone="muted" style={[styles.centreText, styles.description]}>
              {description}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <PressableScale
              onPress={onConfirm}
              accessibilityRole="button"
              style={[
                styles.button,
                destructive ? styles.destructive : styles.primary,
              ]}
            >
              <Text
                variant="control"
                style={destructive ? styles.destructiveText : styles.primaryText}
              >
                {confirmLabel}
              </Text>
            </PressableScale>

            <PressableScale
              onPress={onCancel}
              accessibilityRole="button"
              style={[styles.button, styles.cancel]}
            >
              <Text variant="control">{cancelLabel}</Text>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrimStrong },
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  dialog: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: radius["3xl"],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing["2xl"],
  },
  centreText: { textAlign: "center" },
  description: { marginTop: spacing.sm },
  actions: { marginTop: spacing["2xl"], gap: spacing.md },
  button: {
    height: 56,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  primaryText: { color: colors.primaryForeground },
  destructive: { backgroundColor: colors.destructive },
  destructiveText: { color: "#FFFFFF" },
  cancel: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
