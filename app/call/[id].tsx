import { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing, type } from "@/constants/tokens";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { DetailRecording } from "@/components/sideline/detail-recording";
import { DetailSummary } from "@/components/sideline/detail-summary";
import { formatRecordedAt } from "@/lib/calls/detail";
import { useDemoState } from "@/lib/demo/use-demo";
import { useSimulatedPlayer } from "@/hooks/use-simulated-player";
import {
  getConversationDetail,
  renameCall,
  saveNotes as saveNotesToStore,
} from "@/lib/demo/store";

const TABS = ["Summary", "Recording"] as const;

/**
 * A completed call. The title and its date line stay fixed while the body
 * swipes horizontally between two panes: what the call was about, and the
 * recording itself with its transcript.
 *
 * Uses a paging ScrollView rather than a pager library — `react-native-pager-view`
 * isn't in the Expo Go binary, and paging ScrollView is core RN.
 *
 * The player lives here rather than in the Recording pane so playback survives
 * a swipe back to Summary. In this demo it's a simulated clock (see
 * `useSimulatedPlayer`), which is what keeps the app free of native modules —
 * but it exposes the same shape `expo-audio` does, so the panes below are
 * untouched.
 */
export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const state = useDemoState();

  const [active, setActive] = useState(0);
  const [pagingEnabled, setPagingEnabled] = useState(true);

  // Inline rename, matching the pencil affordance the web app has.
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const pagerRef = useRef<ScrollView>(null);
  const indicator = useSharedValue(0);

  const detail = id ? getConversationDetail(id, state) : null;

  const { player, status } = useSimulatedPlayer(
    detail?.call.duration_seconds ?? 0,
  );

  function startEditName() {
    if (!detail) return;
    setDraftName(detail.call.name);
    setNameError(null);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameError(null);
  }

  /** Returns an error message for the editor, or null on success. */
  async function saveNotes(next: string): Promise<string | null> {
    if (!id) return "Missing call.";
    if (next.length > 10_000) return "Those notes are too long.";
    saveNotesToStore(id, next);
    return null;
  }

  function saveName() {
    if (!detail || savingName) return;
    const next = draftName.trim();
    if (!next) {
      setNameError("The name can't be empty.");
      return;
    }
    if (next.length > 200) {
      setNameError("That name is too long.");
      return;
    }
    if (next === detail.call.name) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    setNameError(null);
    renameCall(detail.call.id, next);
    setSavingName(false);
    setEditingName(false);
  }

  const goTo = useCallback(
    (index: number) => {
      pagerRef.current?.scrollTo({ x: index * width, animated: true });
      setActive(index);
      indicator.value = withTiming(index, { duration: 200 });
    },
    [width, indicator],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicator.value * (width / TABS.length) }],
  }));

  /** Swiping is the source of truth — the tab bar follows the pane. */
  function onMomentumEnd(offsetX: number) {
    if (width === 0) return;
    const index = Math.round(offsetX / width);
    if (index !== active) {
      setActive(index);
      indicator.value = withTiming(index, { duration: 200 });
    }
  }

  if (!detail) {
    return (
      <View style={[styles.fill, styles.centre]}>
        <Text variant="body" tone="muted">
          Conversation not found.
        </Text>
      </View>
    );
  }

  // A finished call always has a recording to scrub, whether or not a real
  // audio file has been dropped in — the simulated clock stands in for one.
  const hasRecording = detail.call.status === "ready";

  return (
    <View style={styles.fill}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <IconButton
          name="chevron-back"
          onPress={() => router.back()}
          accessibilityLabel="Back to calls"
          variant="secondary"
        />
      </View>

      <View style={styles.titleBlock}>
        {editingName ? (
          <>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              editable={!savingName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
              placeholder="Name this call"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="Call name"
              style={styles.titleInput}
            />
            <View style={styles.nameActions}>
              <PressableScale
                onPress={saveName}
                disabled={savingName}
                accessibilityRole="button"
                accessibilityLabel="Save call name"
                style={styles.nameSave}
              >
                <Text variant="label" tone="onBrand" style={styles.nameActionText}>
                  {savingName ? "Saving…" : "Save"}
                </Text>
              </PressableScale>
              <PressableScale
                onPress={cancelEditName}
                disabled={savingName}
                accessibilityRole="button"
                accessibilityLabel="Cancel renaming"
                style={styles.nameCancel}
              >
                <Text variant="label" tone="muted" style={styles.nameActionText}>
                  Cancel
                </Text>
              </PressableScale>
            </View>
            {nameError ? (
              <Text variant="meta" tone="destructive" style={styles.nameError}>
                {nameError}
              </Text>
            ) : null}
          </>
        ) : (
          <PressableScale
            onPress={startEditName}
            activeScale={0.99}
            accessibilityRole="button"
            accessibilityLabel={`Rename call. Currently ${detail.call.name}`}
            style={styles.titleRow}
          >
            <Text variant="title" style={styles.titleText}>
              {detail.call.name}
            </Text>
            <Ionicons
              name="pencil"
              size={16}
              color={colors.mutedForeground}
              style={styles.pencil}
            />
          </PressableScale>
        )}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text variant="label" tone="muted">
              {formatRecordedAt(detail.call.recorded_at)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar} accessibilityRole="tablist">
        {TABS.map((label, i) => (
          <PressableScale
            key={label}
            onPress={() => goTo(i)}
            activeScale={0.97}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === i }}
            style={styles.tab}
          >
            <Text variant="label" tone={active === i ? "default" : "muted"}>
              {label}
            </Text>
          </PressableScale>
        ))}
        <Animated.View
          style={[
            styles.indicator,
            { width: width / TABS.length },
            indicatorStyle,
          ]}
        />
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        scrollEnabled={pagingEnabled}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => onMomentumEnd(e.nativeEvent.contentOffset.x)}
        style={styles.pager}
      >
        <View style={{ width }}>
          <DetailSummary
            detail={detail}
            notes={detail.call.notes}
            onSaveNotes={saveNotes}
            onEditingChange={(editing) => setPagingEnabled(!editing)}
          />
        </View>
        <View style={{ width }}>
          <DetailRecording
            detail={detail}
            player={player}
            status={status}
            hasRecording={hasRecording}
            onScrubStart={() => setPagingEnabled(false)}
            onScrubEnd={() => setPagingEnabled(true)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  centre: { alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: spacing.xl, paddingBottom: 4 },
  titleBlock: { paddingHorizontal: spacing["2xl"], paddingTop: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  titleText: { flexShrink: 1 },
  pencil: { marginTop: 4 },
  titleInput: {
    ...type.title,
    color: colors.foreground,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nameActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  nameSave: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  nameCancel: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  nameActionText: { fontWeight: "600" },
  nameError: { marginTop: spacing.sm },
  chipRow: { flexDirection: "row", marginTop: spacing.md },
  chip: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: "center", paddingTop: 4, paddingBottom: spacing.md },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  pager: { flex: 1 },
});
