import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { colors, radius, spacing, type } from "@/constants/tokens";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { LevelDots } from "@/components/sideline/level-dots";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useFakeRecorder } from "@/hooks/use-fake-recorder";
import { formatDuration } from "@/lib/format";
import { updateRecording } from "@/lib/demo/store";
import { runRecordingPipeline } from "@/lib/demo/pipeline";

const DEFAULT_TITLE = "Untitled note";

/**
 * Full-screen capture surface, presented modally over the feed so it reads as a
 * sheet: recording begins the moment the screen opens — there is no idle
 * "press to start" state.
 *
 * Production captures real audio through `expo-audio`. Here a timer stands in,
 * and ending hands the row to the scripted pipeline. Nothing else about the
 * screen changes; `LevelDots` in particular needed no edit at all, because it
 * was never driven by real amplitude in production either.
 *
 * The `denied` microphone state is gone — there is no permission to refuse.
 */
export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rec = useFakeRecorder();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const active = rec.phase === "recording" || rec.phase === "paused";
  const isPaused = rec.phase === "paused";

  function onEnd() {
    const saved = rec.finish();
    if (saved) {
      // Persist the title and notes before handing off to the pipeline — the
      // name is what the feed row and the finished call are both titled with.
      const trimmedTitle = title.trim();
      const trimmedNotes = notes.trim();
      const patch: { name?: string; notes?: string } = {};
      if (trimmedTitle) patch.name = trimmedTitle;
      if (trimmedNotes) patch.notes = trimmedNotes;
      if (Object.keys(patch).length > 0) updateRecording(saved.id, patch);

      runRecordingPipeline(saved.id);
    }
    router.back();
  }

  function onDiscard() {
    setConfirmDiscard(false);
    rec.discard();
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <IconButton
          name="trash-outline"
          onPress={() => setConfirmDiscard(true)}
          accessibilityLabel="Delete recording"
          variant="secondary"
          tint={colors.mutedForeground}
        />
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={DEFAULT_TITLE}
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="Recording title"
        style={styles.title}
      />

      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Write notes here…"
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="Notes"
        multiline
        textAlignVertical="top"
        style={styles.notes}
      />

      <View
        style={[
          styles.controlWrap,
          { paddingBottom: Math.max(spacing.lg, insets.bottom) },
        ]}
      >
        <View style={styles.controlBar}>
          {isPaused ? (
            <PressableScale
              onPress={rec.resume}
              accessibilityRole="button"
              accessibilityLabel="Resume recording"
              style={styles.resume}
            >
              <Text variant="control" tone="onBrand">
                Resume
              </Text>
            </PressableScale>
          ) : (
            <IconButton
              name="pause"
              onPress={rec.pause}
              accessibilityLabel="Pause recording"
              variant="plain"
              size={48}
              iconSize={20}
              tint={colors.brandForeground}
              style={styles.pause}
            />
          )}

          <View style={styles.readout}>
            <LevelDots active={active && !isPaused} />
            <Text variant="control" tone="onBrand" tabular>
              {formatDuration(rec.durationMillis)}
            </Text>
          </View>

          <PressableScale
            onPress={onEnd}
            accessibilityRole="button"
            accessibilityLabel="End recording"
            style={styles.end}
          >
            <Text variant="control">End</Text>
          </PressableScale>
        </View>
      </View>

      {confirmDiscard ? (
        <ConfirmDialog
          title="Delete this recording?"
          description="The recording and any notes you entered will be permanently discarded."
          confirmLabel="Delete"
          cancelLabel="Keep recording"
          destructive
          onConfirm={onDiscard}
          onCancel={() => setConfirmDiscard(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.card },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...type.titleLarge,
    color: colors.foreground,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
  },
  notes: {
    flex: 1,
    ...type.body,
    color: colors.foreground,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  controlWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    padding: spacing.sm,
  },
  pause: { backgroundColor: "rgba(13,13,13,0.10)" },
  resume: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: "rgba(13,13,13,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  readout: { flexDirection: "row", alignItems: "center", gap: 10 },
  end: {
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
