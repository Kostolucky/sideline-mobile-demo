import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** Accepts the usual array/conditional style idiom, e.g. `[base, on && mod]`. */
  style?: StyleProp<ViewStyle>;
  /** Scale at full press. The mockup uses 0.95 for buttons, 0.98 for rows. */
  activeScale?: number;
}

/**
 * Press feedback matching the mockup's `active:scale-95`. Uses Reanimated
 * rather than Pressable's `pressed` flag so the scale animates smoothly
 * instead of snapping, and so it runs on the UI thread.
 *
 * Disabled presses don't scale — matching `disabled:active:scale-100`.
 */
export function PressableScale({
  style,
  activeScale = 0.95,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) scale.value = withTiming(activeScale, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
}
