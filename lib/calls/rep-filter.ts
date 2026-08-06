/**
 * The Admin's rep filter for the Calls feed.
 *
 * Replaces the old two-way All Calls / My Calls switch: once an Admin can see
 * the whole workspace, "everyone else" is the interesting axis, and a segmented
 * control can't hold five options.
 *
 * Pure and free of React Native imports, so the option list, the filtering and
 * the label are testable without rendering anything. Filtering is always by
 * owner id — never by display name, which is neither unique nor stable.
 */

import type { LocalRecording } from "@/lib/recording/types";

export type RepSelection =
  | { kind: "all" }
  | { kind: "mine" }
  | { kind: "rep"; userId: string };

export const ALL_REPS: RepSelection = { kind: "all" };

/** Minimal shape the filter needs from a workspace member. */
export interface RepOption {
  userId: string;
  name: string;
  role: "admin" | "member";
}

export interface RepFilterOption {
  /** Stable key for the list, and what identifies the choice. */
  key: string;
  label: string;
  selection: RepSelection;
}

/**
 * The choices, in display order: All reps, My calls, then each rep by name.
 *
 * The viewer is left out of the rep list — "My calls" already covers them, and
 * showing an Admin their own name twice reads like a bug.
 */
export function repFilterOptions(
  members: RepOption[],
  currentUserId: string,
): RepFilterOption[] {
  const reps = members
    .filter((m) => m.role === "member" && m.userId !== currentUserId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    { key: "all", label: "All reps", selection: { kind: "all" } },
    { key: "mine", label: "My calls", selection: { kind: "mine" } },
    ...reps.map((r) => ({
      key: r.userId,
      label: r.name,
      selection: { kind: "rep" as const, userId: r.userId },
    })),
  ];
}

/** Key of the currently selected option, for marking it in the list. */
export function selectionKey(selection: RepSelection): string {
  if (selection.kind === "all") return "all";
  if (selection.kind === "mine") return "mine";
  return selection.userId;
}

/**
 * Narrow the feed to the selection.
 *
 * Presentation only — it can never widen what's visible. The store has already
 * decided what this persona may see (`visibleRecordings`), standing in for the
 * row-level security that does the same job in production.
 */
export function filterByRep(
  recordings: LocalRecording[],
  selection: RepSelection,
  currentUserId: string | undefined,
): LocalRecording[] {
  if (selection.kind === "all") return recordings;
  if (selection.kind === "mine") {
    if (!currentUserId) return recordings;
    return recordings.filter((r) => r.userId === currentUserId);
  }
  return recordings.filter((r) => r.userId === selection.userId);
}

/** Text on the filter's trigger — the current choice, never a generic word. */
export function repFilterLabel(
  selection: RepSelection,
  namesByUserId: Record<string, string>,
): string {
  if (selection.kind === "all") return "All reps";
  if (selection.kind === "mine") return "My calls";
  return namesByUserId[selection.userId] ?? "Unknown rep";
}

/** Empty-state copy for whichever slice came back with nothing. */
export function repFilterEmptyMessage(selection: RepSelection): string {
  if (selection.kind === "mine") return "You have not recorded any calls yet.";
  if (selection.kind === "rep") return "No calls found for this rep.";
  return "No calls have been recorded yet.";
}
