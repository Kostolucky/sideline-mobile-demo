import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, type } from "@/constants/tokens";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { useDemoState } from "@/lib/demo/use-demo";
import { getConversationDetail } from "@/lib/demo/store";

/**
 * Suggested prompts, shown above the composer.
 *
 * Two, deliberately. The reference design carries several generic meeting
 * prompts; the only ones that matter after a sales call are the two follow-ups
 * a rep actually has to write.
 */
const SUGGESTIONS = ["Write a follow-up email", "Write a follow-up text"];

/**
 * "Chat with note" — ask a question about a call.
 *
 * A SHELL. Nothing here answers anything yet: the composer accepts text and
 * the suggestions are inert. It exists so the surface can be shown and agreed
 * on before any of it is wired up.
 *
 * Pushed onto the stack rather than presented as a sheet, so the back chevron
 * behaves the way the design implies — it returns to the call the chat was
 * opened from.
 */
export default function ChatWithNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useDemoState();

  const [draft, setDraft] = useState("");

  const detail = id ? getConversationDetail(id, state) : null;
  const title = detail?.call.name ?? "Call";
  const canSend = draft.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <IconButton
          name="chevron-back"
          // Normally there is history to pop, because this screen is reached
          // from the call's Summary pane. Opened directly by a deep link there
          // isn't, so fall back to the call rather than doing nothing.
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace({ pathname: "/call/[id]", params: { id } })
          }
          accessibilityLabel="Back to the call"
          variant="secondary"
        />
        {/* Centred independently of the button, so the title doesn't shift
            when the name is short. */}
        <View style={styles.titleWrap} pointerEvents="none">
          <Text variant="subheading" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
      </View>

      {/* Empty until there's a conversation to show. */}
      <View style={styles.thread} />

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(spacing.lg, insets.bottom) },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
          keyboardShouldPersistTaps="handled"
        >
          {SUGGESTIONS.map((label) => (
            <PressableScale
              key={label}
              onPress={() => {}}
              activeScale={0.97}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={styles.chip}
            >
              <Text variant="label">{label}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="Ask anything"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Ask anything about this call"
            style={styles.input}
          />
          <PressableScale
            onPress={() => {}}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            style={[styles.send, !canSend && styles.sendDisabled]}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={canSend ? colors.brandForeground : colors.mutedForeground}
            />
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleWrap: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    bottom: spacing.md,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 72,
  },
  title: { textAlign: "center" },
  thread: { flex: 1 },
  footer: { paddingHorizontal: spacing.lg, gap: spacing.md },
  suggestions: { gap: spacing.sm, paddingHorizontal: 2 },
  chip: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  input: {
    flex: 1,
    ...type.body,
    color: colors.foreground,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.input,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { backgroundColor: colors.secondary },
});
