import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type {
  SimulatedPlayer,
  SimulatedPlayerStatus,
} from "@/hooks/use-simulated-player";

import { colors, radius, spacing } from "@/constants/tokens";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Scrubber } from "@/components/ui/scrubber";
import { Text } from "@/components/ui/text";
import { buildSpeakerLabels, clock, isRepSpeaker } from "@/lib/calls/detail";
import type { ConversationDetail } from "@/lib/data";

/** Height used to centre the active line when auto-following playback. */
const FOLLOW_OFFSET = 160;

/**
 * Second pane: a playback bar pinned above a diarized transcript that follows
 * the playhead. Tapping a line seeks to it.
 *
 * The transcript comes from `transcript_utterances`, which the app has always
 * fetched but never displayed until now.
 */
export function DetailRecording({
  detail,
  player,
  status,
  hasRecording,
  onScrubStart,
  onScrubEnd,
}: {
  detail: ConversationDetail;
  /** Owned by the parent so the Feedback pane can seek into the same audio. */
  player: SimulatedPlayer;
  status: SimulatedPlayerStatus;
  /**
   * There is a recording to play.
   *
   * Deliberately NOT `!!detail.audioUrl`: in this demo playback runs on a
   * simulated clock and no audio file is shipped, so keying the transport off a
   * real URL hid it on every call. A finished call always has a recording to
   * scrub, whether or not a file has been dropped into `assets/audio`.
   */
  hasRecording: boolean;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const utterances = detail.utterances;
  const speakerLabels = useMemo(() => buildSpeakerLabels(utterances), [utterances]);

  const scrollRef = useRef<ScrollView>(null);
  const lineOffsets = useRef(new Map<string, number>());
  const [following, setFollowing] = useState(true);

  const positionMs = (status.currentTime ?? 0) * 1000;
  const durationMs =
    (status.duration ?? detail.call.duration_seconds ?? 0) * 1000;

  // The line currently being spoken: the last one that has started.
  const activeIndex = useMemo(() => {
    let found = utterances.length > 0 ? 0 : -1;
    for (let i = 0; i < utterances.length; i++) {
      if (utterances[i].start_ms <= positionMs) found = i;
      else break;
    }
    return found;
  }, [utterances, positionMs]);

  const activeId = utterances[activeIndex]?.id;

  // Keep the spoken line in view while playing. Suspended once the user
  // scrolls manually, so following never fights their scrolling.
  useEffect(() => {
    if (!following || !status.playing || !activeId) return;
    const offset = lineOffsets.current.get(activeId);
    if (offset == null) return;
    scrollRef.current?.scrollTo({
      y: Math.max(0, offset - FOLLOW_OFFSET),
      animated: true,
    });
  }, [activeId, following, status.playing]);

  function seekTo(ms: number) {
    player.seekTo(ms / 1000);
  }

  if (!hasRecording && utterances.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="body" tone="muted">
          No recording or transcript is available for this call.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {hasRecording ? (
        <View style={styles.playbackWrap}>
          <View style={styles.playbackBar}>
            <IconButton
              name={status.playing ? "pause" : "play"}
              onPress={() => (status.playing ? player.pause() : player.play())}
              accessibilityLabel={status.playing ? "Pause playback" : "Play recording"}
              variant="brand"
              size={40}
              iconSize={16}
            />

            <View style={styles.trackArea}>
              <Scrubber
                value={positionMs}
                duration={durationMs}
                onSeek={seekTo}
                onScrubStart={onScrubStart}
                onScrubEnd={onScrubEnd}
              />
              <View style={styles.times}>
                <Text variant="meta" tone="muted" tabular>
                  {clock(positionMs)}
                </Text>
                <Text variant="meta" tone="muted" tabular>
                  {clock(durationMs)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.transcript}
        onScrollBeginDrag={() => setFollowing(false)}
      >
        {utterances.length === 0 ? (
          <Text variant="body" tone="muted">
            No transcript is available for this call.
          </Text>
        ) : (
          utterances.map((u, i) => {
            const active = i === activeIndex;
            const rep = isRepSpeaker(u.speaker, speakerLabels);
            return (
              <PressableScale
                key={u.id}
                onPress={() => {
                  setFollowing(true);
                  seekTo(u.start_ms);
                }}
                activeScale={0.99}
                accessibilityRole="button"
                onLayout={(e) =>
                  lineOffsets.current.set(u.id, e.nativeEvent.layout.y)
                }
                style={[styles.line, active && styles.lineActive]}
              >
                <View style={styles.lineHead}>
                  <Text variant="meta" tone={rep ? "brand" : "muted"} style={styles.speaker}>
                    {speakerLabels[u.speaker] ?? u.speaker}
                  </Text>
                  <Text variant="meta" tone="muted" tabular>
                    {clock(u.start_ms)}
                  </Text>
                </View>
                <Text
                  variant="body"
                  style={active ? undefined : styles.inactiveText}
                >
                  {u.text}
                </Text>
              </PressableScale>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  empty: { flex: 1, padding: spacing["2xl"] },
  playbackWrap: { paddingHorizontal: spacing["2xl"], paddingTop: spacing.lg },
  playbackBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
  },
  trackArea: { flex: 1, minWidth: 0 },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  transcript: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: 64,
  },
  line: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  lineActive: { backgroundColor: colors.card },
  lineHead: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  speaker: { fontWeight: "600" },
  inactiveText: { opacity: 0.75 },
});
