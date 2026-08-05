import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

import { colors, radius, spacing } from "@/constants/tokens";

export interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible name for the scrim's dismiss action. */
  closeLabel?: string;
}

/**
 * Bottom sheet rendered over the active screen, matching the mockup's account
 * sheet: dimmed scrim that dismisses on tap, rounded top corners, grab handle,
 * and a safe-area-aware bottom inset.
 *
 * Deliberately not RN's `<Modal>` — the mockup composes the sheet inside the
 * existing screen so the content behind stays visible and the slide-up reads as
 * one continuous surface.
 */
export function BottomSheet({
  onClose,
  children,
  closeLabel = "Close",
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={styles.scrim}
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(spacing["3xl"], insets.bottom + spacing.lg) },
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    marginTop: "auto",
    backgroundColor: colors.card,
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing["2xl"],
  },
});
