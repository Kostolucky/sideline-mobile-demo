import { Modal, Pressable, StyleSheet, View } from "react-native";
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
 * Bottom sheet: dimmed scrim that dismisses on tap, rounded top corners, a grab
 * handle, and a safe-area-aware bottom inset.
 *
 * DIVERGES FROM PRODUCTION, on purpose. Production composes the sheet directly
 * into the host screen and notes that it is "deliberately not RN's `<Modal>`".
 * That works only while the sheet is mounted *after* the screen's scrollable
 * content — mount it earlier and the list simply paints over it. That bug has
 * already shipped here once (the account sheet showed through the gaps between
 * call rows), and the fix at the call site is invisible to anyone reading the
 * component.
 *
 * A transparent `<Modal>` renders in its own native overlay window, so the
 * sheet is on top regardless of where it sits in the tree. The content behind
 * stays visible through the scrim exactly as before — the composition argument
 * is preserved, the ordering hazard is not.
 */
export function BottomSheet({
  onClose,
  children,
  closeLabel = "Close",
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
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
    </Modal>
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
