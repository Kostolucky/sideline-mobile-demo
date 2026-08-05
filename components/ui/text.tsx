import { Text as RNText, StyleSheet, type TextProps } from "react-native";

import { colors, tabularNums, type } from "@/constants/tokens";

type Variant = keyof typeof type;
type Tone = "default" | "muted" | "brand" | "destructive" | "onBrand";

export interface AppTextProps extends TextProps {
  /** Type-scale entry from the design tokens. Defaults to body copy. */
  variant?: Variant;
  /** Semantic colour. Defaults to primary foreground. */
  tone?: Tone;
  /** Monospaced digits — for timers, durations, playback positions. */
  tabular?: boolean;
}

const TONES: Record<Tone, string> = {
  default: colors.foreground,
  muted: colors.mutedForeground,
  brand: colors.brand,
  destructive: colors.destructive,
  onBrand: colors.brandForeground,
};

/**
 * The single text primitive for the redesigned UI. Everything routes through
 * the token type scale so the app stays visually consistent with the mockup —
 * screens should not hand-roll fontSize/fontWeight.
 */
export function Text({
  variant = "body",
  tone = "default",
  tabular = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      style={[
        styles[variant],
        { color: TONES[tone] },
        tabular && tabularNums,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create(type);
