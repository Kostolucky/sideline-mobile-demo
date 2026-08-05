import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { colors, radius } from "@/constants/tokens";

export interface ScrubberProps {
  /** Current position, same unit as `duration`. */
  value: number;
  duration: number;
  /** Fired continuously while dragging and on tap. */
  onSeek: (value: number) => void;
  /** Lets the parent pager disable horizontal paging during a drag. */
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 14;

/**
 * Playback scrubber. Hand-rolled because the app must keep running in Expo Go,
 * which can't load `@react-native-community/slider` — its native code isn't in
 * the Expo Go binary. Built on gesture-handler, which is.
 *
 * The parent is told when a drag starts/ends so it can suspend the horizontal
 * pane pager; otherwise the pager steals the drag before it reaches us.
 */
export function Scrubber({
  value,
  duration,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: ScrubberProps) {
  const [width, setWidth] = useState(0);
  const safeDuration = Math.max(duration, 1);
  const ratio = Math.min(1, Math.max(0, value / safeDuration));

  function seekAtX(x: number) {
    if (width <= 0) return;
    const clamped = Math.min(width, Math.max(0, x));
    onSeek((clamped / width) * safeDuration);
  }

  const pan = Gesture.Pan()
    .onBegin((e) => {
      if (onScrubStart) runOnJS(onScrubStart)();
      runOnJS(seekAtX)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(seekAtX)(e.x);
    })
    .onFinalize(() => {
      if (onScrubEnd) runOnJS(onScrubEnd)();
    });

  const tap = Gesture.Tap().onEnd((e) => {
    runOnJS(seekAtX)(e.x);
  });

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      {/* Padding widens the touch target without thickening the visible track. */}
      <View
        style={styles.touchArea}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <View
          style={[
            styles.thumb,
            { left: Math.max(0, ratio * width - THUMB_SIZE / 2) },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchArea: { justifyContent: "center", paddingVertical: 10 },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    overflow: "hidden",
  },
  fill: { height: TRACK_HEIGHT, backgroundColor: colors.brand },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
});
