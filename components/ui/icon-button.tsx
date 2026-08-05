import { StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Variant = "secondary" | "brand" | "plain";

const BACKGROUNDS: Record<Variant, string | undefined> = {
  secondary: colors.secondary,
  brand: colors.brand,
  plain: undefined,
};

const TINTS: Record<Variant, string> = {
  secondary: colors.foreground,
  brand: colors.brandForeground,
  plain: colors.mutedForeground,
};

export interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  /** Required — these are icon-only controls with no visible label. */
  accessibilityLabel: string;
  variant?: Variant;
  /** Diameter of the button. The mockup's standard control is 44. */
  size?: number;
  /** Glyph size. Defaults to a proportional value. */
  iconSize?: number;
  tint?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Circular icon control — back chevron, delete, pause, account avatar slot. */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = "secondary",
  size = 44,
  iconSize,
  tint,
  disabled,
  style,
}: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: BACKGROUNDS[variant],
        },
        style as ViewStyle,
      ]}
    >
      <Ionicons
        name={name}
        size={iconSize ?? Math.round(size * 0.45)}
        color={tint ?? TINTS[variant]}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});
