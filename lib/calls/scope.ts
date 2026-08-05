import type { LocalRecording } from "@/lib/recording/types";

/** Which slice of the feed an Admin is looking at. */
export type FeedScope = "all" | "mine";

/**
 * Narrow the feed to the selected scope.
 *
 * This is presentation only — it never widens what you can see. The server has
 * already decided that via RLS (`calls_select`), so a User's feed is their own
 * calls whatever this returns, and "All Calls" can only ever show what the Admin
 * was already permitted to read.
 */
export function filterByScope(
  recordings: LocalRecording[],
  scope: FeedScope,
  isAdmin: boolean,
  currentUserId: string | undefined,
): LocalRecording[] {
  // A User has nothing to narrow — every visible call is already theirs.
  if (!isAdmin || scope === "all") return recordings;
  if (!currentUserId) return recordings;
  return recordings.filter((r) => r.userId === currentUserId);
}
