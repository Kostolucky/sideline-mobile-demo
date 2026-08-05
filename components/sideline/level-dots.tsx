import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { radius } from "@/constants/tokens";

const BARS = [0, 1, 2, 3];

/**
 * Small animated bars standing in for a live level meter, ported from the
 * mockup's `waveform-bounce` keyframes.
 *
 * Decorative only — it is not driven by real input amplitude. Real metering
 * would need `isMeteringEnabled` on the recorder options, which the capture
 * format doesn't currently set.
 */
export function LevelDots({ active }: { active: boolean }) {
  return (
    <View style={styles.row} accessible={false} importantForAccessibility="no">
      {BARS.map((i) => (
        <Bar key={i} index={i} active={active} />
      ))}
    </View>
  );
}

function Bar({ index, active }: { index: number; active: boolean }) {
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale);
      scale.value = withTiming(0.3, { duration: 150 });
      return;
    }
    const duration = (800 + (index % 3) * 150) / 2;
    scale.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [active, index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 3 },
  bar: {
    width: 3,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: "rgba(13,13,13,0.7)",
  },
});
