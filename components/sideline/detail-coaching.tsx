import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, type } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { clock } from "@/lib/calls/detail";
import {
  buildCoachingThread,
  composerPlaceholder,
  emptyCopy,
  type CoachingMessage,
} from "@/lib/calls/coaching";
import type { MemberRole } from "@/lib/auth";
import type { ConversationDetail } from "@/lib/data";

/** Brand green at low alpha — the tint used for own-message surfaces. */
const BRAND_WASH = "rgba(73,248,96,0.14)";

/**
 * Third pane: the coaching conversation for this call.
 *
 * Rendered as a two-sided message thread rather than a stack of coaching cards,
 * because coaching here is a back-and-forth between one Admin and one rep. Your
 * own messages sit right in a green wash; the other person's sit left on
 * charcoal, named.
 *
 * People only. The analysis pass writes its own suggestions elsewhere; this tab
 * is the human conversation about the call and nothing else.
 */
export function DetailCoaching({
  detail,
  role,
  viewerId,
  namesByUserId,
  currentPositionMs,
  canAttachMoment,
  onSeek,
  onSend,
  onEditingChange,
}: {
  detail: ConversationDetail;
  role: MemberRole;
  viewerId: string | null;
  namesByUserId: Record<string, string>;
  /** Playhead position, offered as an optional anchor for a new message. */
  currentPositionMs: number;
  /** False when there's no audio to anchor to. */
  canAttachMoment: boolean;
  onSeek: (ms: number) => void;
  onSend: (input: {
    body: string;
    timestampMs: number | null;
  }) => Promise<string | null>;
  /** Lets the parent stop horizontal paging while the composer has focus. */
  onEditingChange: (editing: boolean) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const atBottom = useRef(true);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachMoment, setAttachMoment] = useState(false);

  const thread = useMemo(
    () =>
      buildCoachingThread(detail.comments, {
        viewerId,
        namesByUserId,
        callOwnerId: detail.call.recorded_by,
      }),
    [detail.comments, detail.call.recorded_by, viewerId, namesByUserId],
  );

  // Anchoring to 0:00 would be meaningless, so the option only appears once the
  // audio has actually been moved to a moment worth pointing at.
  const momentMs = Math.floor(currentPositionMs);
  const canAttach = canAttachMoment && momentMs > 0;
  useEffect(() => {
    if (!canAttach && attachMoment) setAttachMoment(false);
  }, [canAttach, attachMoment]);

  /**
   * Open on the newest message, and follow new ones — but only while the reader
   * is already at the bottom, so scrolling back through history isn't yanked
   * away when something arrives.
   */
  const scrollToEnd = useCallback((animated: boolean) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  const hasThread = thread.length > 0;

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);
    const failure = await onSend({
      body,
      timestampMs: attachMoment && canAttach ? momentMs : null,
    });
    setSending(false);

    if (failure) {
      // The draft is deliberately left in place so a retry is one tap, not a
      // retype.
      setError(failure);
      return;
    }
    setDraft("");
    setAttachMoment(false);
    atBottom.current = true;
    requestAnimationFrame(() => scrollToEnd(true));
  }

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.body,
          !hasThread && styles.bodyEmpty,
        ]}
        onContentSizeChange={() => {
          if (atBottom.current) scrollToEnd(false);
        }}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } =
            e.nativeEvent;
          const distance =
            contentSize.height - contentOffset.y - layoutMeasurement.height;
          atBottom.current = distance < 48;
        }}
        scrollEventThrottle={64}
        keyboardShouldPersistTaps="handled"
      >
        {hasThread ? (
          thread.map((item) =>
            item.kind === "day" ? (
              <View key={item.id} style={styles.dayRow}>
                <Text variant="meta" tone="muted">
                  {item.label}
                </Text>
              </View>
            ) : (
              <MessageBubble key={item.id} message={item} onSeek={onSeek} />
            ),
          )
        ) : (
          <EmptyState role={role} />
        )}
      </ScrollView>

      <View style={styles.composer}>
        {error ? (
          <Text variant="meta" tone="destructive" style={styles.error}>
            {error}
          </Text>
        ) : null}

        {canAttach ? (
          <PressableScale
            onPress={() => setAttachMoment((v) => !v)}
            activeScale={0.97}
            accessibilityRole="switch"
            accessibilityState={{ checked: attachMoment }}
            accessibilityLabel={`Attach recording moment ${clock(momentMs)}`}
            style={[styles.attach, attachMoment && styles.attachOn]}
          >
            <Ionicons
              name={attachMoment ? "checkmark-circle" : "time-outline"}
              size={13}
              color={attachMoment ? colors.brand : colors.mutedForeground}
            />
            <Text
              variant="meta"
              tone={attachMoment ? "brand" : "muted"}
              tabular
            >
              Recording {clock(momentMs)}
            </Text>
          </PressableScale>
        ) : null}

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (error) setError(null);
            }}
            onFocus={() => onEditingChange(true)}
            onBlur={() => onEditingChange(false)}
            editable={!sending}
            multiline
            placeholder={composerPlaceholder(role)}
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel={composerPlaceholder(role)}
            style={styles.input}
          />
          <PressableScale
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            style={[styles.send, !canSend && styles.sendDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.brandForeground} />
            ) : (
              <Ionicons
                name="arrow-up"
                size={18}
                color={
                  canSend ? colors.brandForeground : colors.mutedForeground
                }
              />
            )}
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** One message. Side, colour and corner all encode who sent it. */
function MessageBubble({
  message,
  onSeek,
}: {
  message: CoachingMessage;
  onSeek: (ms: number) => void;
}) {
  const { mine, authorName, body, time, timestampMs } = message;

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <View style={styles.metaRow}>
          {authorName ? (
            <Text variant="meta" tone="brand" style={styles.author}>
              {authorName}
            </Text>
          ) : null}

          {timestampMs != null ? (
            <>
              {authorName ? (
                <Text variant="meta" tone="muted">
                  ·
                </Text>
              ) : null}
              <PressableScale
                onPress={() => onSeek(timestampMs)}
                activeScale={0.94}
                accessibilityRole="button"
                accessibilityLabel={`Play recording from ${clock(timestampMs)}`}
                style={styles.stamp}
              >
                <Ionicons name="play" size={9} color={colors.brand} />
                <Text variant="meta" tone="brand" tabular>
                  Recording {clock(timestampMs)}
                </Text>
              </PressableScale>
            </>
          ) : null}
        </View>

        <Text variant="body">{body}</Text>
      </View>

      <Text variant="meta" tone="muted" style={styles.time}>
        {time}
      </Text>
    </View>
  );
}

function EmptyState({ role }: { role: MemberRole }) {
  const copy = emptyCopy(role);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={22}
          color={colors.mutedForeground}
        />
      </View>
      <Text variant="subheading">{copy.title}</Text>
      <Text variant="body" tone="muted" style={styles.emptyBody}>
        {copy.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  bodyEmpty: { flexGrow: 1, justifyContent: "center" },

  // --- thread ---------------------------------------------------------------
  dayRow: { alignItems: "center", paddingVertical: spacing.xs },
  row: { maxWidth: "88%", gap: 3 },
  rowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: BRAND_WASH,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: radius.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  author: { fontWeight: "600" },
  stamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(73,248,96,0.12)",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  time: { paddingHorizontal: 4 },

  // --- empty ----------------------------------------------------------------
  empty: { alignItems: "center", paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyBody: { textAlign: "center" },

  // --- composer -------------------------------------------------------------
  composer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  error: { paddingHorizontal: spacing.xs },
  attach: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  attachOn: {
    borderColor: colors.brand,
    backgroundColor: "rgba(73,248,96,0.12)",
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
