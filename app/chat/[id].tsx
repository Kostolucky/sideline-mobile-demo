import { useCallback, useEffect, useRef, useState } from "react";
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
import { TIMINGS } from "@/lib/demo/timings";
import { followUpReply, tokenize } from "@/lib/calls/chat-reply";

/** Brand green at low alpha — the tint used for own-message surfaces. */
const BRAND_WASH = "rgba(73,248,96,0.14)";

/**
 * Suggested prompts, shown above the composer until the conversation starts.
 *
 * Two, deliberately. The reference design carries several generic meeting
 * prompts; the only ones that matter after a sales call are the two follow-ups
 * a rep actually has to write.
 */
const SUGGESTIONS = ["Write a follow-up email", "Write a follow-up text"];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/**
 * "Chat with note" — ask a question about a call.
 *
 * SCRIPTED, NOT INTELLIGENT. There is no model here. Whatever you send, the
 * assistant pauses as if thinking and then writes out the follow-up for this
 * call, word by word. The text is the call's own `customer_follow_up_draft`, so
 * what appears is genuinely about that conversation — which is what makes the
 * illusion hold when someone actually reads it.
 *
 * The reveal is deliberate rather than instant: a wall of text appearing at
 * once reads as canned, whereas watching it being written reads as generated.
 * Both delays live in `timings.ts`.
 */
export default function ChatWithNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const state = useDemoState();

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** True from the moment a message is sent until the last word lands. */
  const [generating, setGenerating] = useState(false);
  /** The assistant has started writing — the "Generating…" line gives way. */
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const detail = id ? getConversationDetail(id, state) : null;
  const title = detail?.call.name ?? "Call";

  // Nothing should keep ticking after the screen goes away.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  const send = useCallback(
    (body: string) => {
      const text = body.trim();
      if (!text || !detail || generating) return;

      const stamp = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: `u-${stamp}`, role: "user", text },
      ]);
      setDraft("");
      setGenerating(true);
      setStreaming(false);

      const reply = followUpReply(detail);
      const tokens = tokenize(reply);
      const assistantId = `a-${stamp}`;
      const { thinkingMs, tokenMs } = TIMINGS.chat;

      // Think first, then reveal one token at a time. Timers rather than a
      // single interval, so each step is independently cancellable on unmount.
      timers.current.push(
        setTimeout(() => {
          setStreaming(true);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", text: "" },
          ]);

          tokens.forEach((_, i) => {
            timers.current.push(
              setTimeout(
                () => {
                  const shown = tokens.slice(0, i + 1).join("");
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, text: shown } : m,
                    ),
                  );
                  if (i === tokens.length - 1) {
                    setGenerating(false);
                    setStreaming(false);
                  }
                },
                tokenMs * (i + 1),
              ),
            );
          });
        }, thinkingMs),
      );
    },
    [detail, generating],
  );

  const hasConversation = messages.length > 0;
  const canSend = draft.trim().length > 0 && !generating;

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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <View key={m.id} style={styles.userRow}>
              <View style={styles.userBubble}>
                <Text variant="body">{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={m.id} style={styles.assistantRow}>
              <Text variant="body">{m.text}</Text>
            </View>
          ),
        )}

        {generating && !streaming ? (
          <Text variant="body" tone="muted" style={styles.generating}>
            Generating…
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(spacing.lg, insets.bottom) },
        ]}
      >
        {/* Once the conversation has started, the prompts have served their
            purpose and the composer is the thing to reach for. */}
        {!hasConversation ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
            keyboardShouldPersistTaps="handled"
          >
            {SUGGESTIONS.map((label) => (
              <PressableScale
                key={label}
                onPress={() => send(label)}
                activeScale={0.97}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={styles.chip}
              >
                <Text variant="label">{label}</Text>
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}

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
            onPress={() => send(draft)}
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
  thread: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  userRow: { alignItems: "flex-end" },
  userBubble: {
    maxWidth: "88%",
    backgroundColor: BRAND_WASH,
    borderRadius: radius.xl,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  // The assistant's reply is plain text, not a bubble — it is long-form
  // writing meant to be read and copied, not a chat quip.
  assistantRow: { paddingRight: spacing.sm },
  generating: { fontStyle: "italic" },
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
