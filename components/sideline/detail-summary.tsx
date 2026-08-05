import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";

import { colors, radius, spacing, type } from "@/constants/tokens";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Text } from "@/components/ui/text";
import { parseInsights, toStringList } from "@/lib/calls/detail";
import type { ConversationDetail } from "@/lib/data";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="sectionLabel" tone="muted">
      {children}
    </Text>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.dot} />
          <Text variant="body" style={styles.bulletText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * First pane: the generated summary followed by the rep's own notes.
 *
 * Notes live on `calls.notes`, so they're the same text the web app shows. The
 * rep who recorded the call can add to them at any time — during the call or
 * days later; an Admin reading someone else's call sees them read-only, because
 * manager input belongs in Feedback.
 */
export function DetailSummary({
  detail,
  notes,
  canEditNotes,
  onSaveNotes,
  onEditingChange,
}: {
  detail: ConversationDetail;
  notes: string | null;
  canEditNotes: boolean;
  /** Returns an error message, or null on success. */
  onSaveNotes: (next: string) => Promise<string | null>;
  /** Lets the parent disable horizontal paging while the editor has focus. */
  onEditingChange: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(notes ?? "");
    setError(null);
    setEditing(true);
    onEditingChange(true);
  }

  function stopEditing() {
    setEditing(false);
    setError(null);
    onEditingChange(false);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const message = await onSaveNotes(draft);
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    stopEditing();
  }
  const insights = parseInsights(detail.analysis?.result);
  const overview = detail.summary?.summary ?? null;
  const takeaways = toStringList(detail.summary?.main_takeaways);
  const nextSteps =
    toStringList(detail.summary?.next_steps).length > 0
      ? toStringList(detail.summary?.next_steps)
      : (insights?.next_steps ?? []);
  const strengths = insights?.strengths ?? [];

  const hasSummary =
    !!overview || takeaways.length > 0 || nextSteps.length > 0 || strengths.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      {hasSummary ? (
        <View>
          <SectionLabel>AI Summary</SectionLabel>

          <View style={styles.sections}>
            {overview ? (
              <View style={styles.section}>
                <Text variant="subheading">Customer situation</Text>
                <Text variant="body">{overview}</Text>
              </View>
            ) : null}

            {takeaways.length > 0 ? (
              <View style={styles.section}>
                <Text variant="subheading">Key discussion points</Text>
                <Bullets items={takeaways} />
              </View>
            ) : null}

            {strengths.length > 0 ? (
              <View style={styles.section}>
                <Text variant="subheading">What went well</Text>
                <Bullets items={strengths} />
              </View>
            ) : null}

            {nextSteps.length > 0 ? (
              <View style={styles.section}>
                <Text variant="subheading">Next steps</Text>
                <Bullets items={nextSteps} />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <Text variant="body" tone="muted">
          No summary is available for this call yet.
        </Text>
      )}

      <View style={styles.notesBlock}>
        <SectionLabel>Notes</SectionLabel>

        {editing ? (
          <View style={styles.notesEditor}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              editable={!saving}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder="Add anything worth remembering about this call…"
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="Call notes"
              style={styles.notesInput}
            />
            {error ? (
              <Text variant="meta" tone="destructive" style={styles.notesError}>
                {error}
              </Text>
            ) : null}
            <View style={styles.notesActions}>
              <PressableScale
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save notes"
                style={styles.notesSave}
              >
                <Text variant="label" tone="onBrand" style={styles.notesActionText}>
                  {saving ? "Saving…" : "Save notes"}
                </Text>
              </PressableScale>
              <PressableScale
                onPress={stopEditing}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing notes"
                style={styles.notesCancel}
              >
                <Text variant="label" tone="muted" style={styles.notesActionText}>
                  Cancel
                </Text>
              </PressableScale>
            </View>
          </View>
        ) : (
          <>
            <Text
              variant="body"
              tone={notes ? "default" : "muted"}
              style={styles.notesText}
            >
              {notes ??
                (canEditNotes
                  ? "No notes on this call yet."
                  : "No notes were added for this call.")}
            </Text>
            {canEditNotes ? (
              <PressableScale
                onPress={startEditing}
                accessibilityRole="button"
                accessibilityLabel={notes ? "Edit notes" : "Add notes"}
                style={styles.notesEditButton}
              >
                <Text variant="label" tone="brand" style={styles.notesActionText}>
                  {notes ? "Edit notes" : "Add notes"}
                </Text>
              </PressableScale>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: 64,
  },
  sections: { marginTop: spacing.lg, gap: spacing["2xl"] },
  section: { gap: spacing.sm },
  bullets: { gap: 6 },
  bulletRow: { flexDirection: "row", gap: 10 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mutedForeground,
    marginTop: 10,
  },
  bulletText: { flex: 1 },
  notesBlock: { marginTop: 40 },
  notesEditor: { marginTop: spacing.md },
  notesInput: {
    ...type.body,
    minHeight: 120,
    color: colors.foreground,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notesError: { marginTop: spacing.sm },
  notesActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  notesSave: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  notesCancel: {
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  notesEditButton: { marginTop: spacing.md, alignSelf: "flex-start" },
  notesActionText: { fontWeight: "600" },
  notesText: { marginTop: spacing.lg },
});
