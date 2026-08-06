/**
 * Shaping for the Coaching inbox — the list of calls that have coaching
 * activity, newest first.
 *
 * Pure and free of React Native imports, so the ordering, the "who am I talking
 * to" rule and the relative-time formatting are all testable without rendering
 * anything. The screen passes state in; nothing here reaches for a store.
 *
 * This is the list, not the thread. The thread itself is already built by
 * `buildCoachingThread` in `./coaching.ts` and rendered on the call detail
 * screen's Coaching pane.
 */

import type { Comment } from "@/lib/data";

export interface CoachingInboxCall {
  id: string;
  name: string;
  /** The rep the call belongs to. */
  recordedBy: string;
}

export interface CoachingInboxItem {
  callId: string;
  callName: string;
  /**
   * The other person in this conversation, from the viewer's perspective.
   * Null when it can't be worked out, in which case the row just omits it.
   */
  otherPartyName: string | null;
  /** First line of the newest message. */
  preview: string;
  /** ISO timestamp of the newest message, for the row's time label. */
  lastMessageAt: string;
  /** Newest message was written by the viewer — the row says "You:". */
  lastMessageMine: boolean;
  unread: number;
}

/**
 * Who the viewer is talking to on this call.
 *
 * The newest author who isn't the viewer, because that's who they'd be
 * replying to. Falls back to the call's rep — which covers an Admin looking at
 * a thread where only they have written so far.
 */
function otherParty(
  comments: Comment[],
  call: CoachingInboxCall,
  viewerId: string,
  namesByUserId: Record<string, string>,
): string | null {
  for (let i = comments.length - 1; i >= 0; i--) {
    const authorId = comments[i].author_user_id;
    if (authorId !== viewerId) return namesByUserId[authorId] ?? null;
  }
  if (call.recordedBy !== viewerId) {
    return namesByUserId[call.recordedBy] ?? null;
  }
  return null;
}

/** Collapse a message to a single line so rows can't grow unevenly. */
function previewOf(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

export function buildCoachingInbox(input: {
  /** Calls the viewer is allowed to see. */
  calls: CoachingInboxCall[];
  /** Every comment in the workspace; filtered to `calls` here. */
  comments: Comment[];
  viewerId: string;
  namesByUserId: Record<string, string>;
  /** call id -> unread count for this viewer. */
  unreadByCall: Record<string, number>;
}): CoachingInboxItem[] {
  const { calls, comments, viewerId, namesByUserId, unreadByCall } = input;

  const byCall = new Map<string, Comment[]>();
  for (const c of comments) {
    const bucket = byCall.get(c.call_id);
    if (bucket) bucket.push(c);
    else byCall.set(c.call_id, [c]);
  }

  const items: CoachingInboxItem[] = [];

  for (const call of calls) {
    const thread = byCall.get(call.id);
    // A call with no coaching isn't in the inbox at all — this is a list of
    // conversations, not a second copy of the call list.
    if (!thread || thread.length === 0) continue;

    const ordered = [...thread].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    const newest = ordered[ordered.length - 1];

    items.push({
      callId: call.id,
      callName: call.name,
      otherPartyName: otherParty(ordered, call, viewerId, namesByUserId),
      preview: previewOf(newest.body),
      lastMessageAt: newest.created_at,
      lastMessageMine: newest.author_user_id === viewerId,
      unread: unreadByCall[call.id] ?? 0,
    });
  }

  return items.sort(
    (a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt),
  );
}

/**
 * Compact time label for an inbox row: "Now", "12m", "5h", "Yesterday", "Thu",
 * then "28 May" once it's more than a week old.
 *
 * `now` is injectable so this is testable.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (!Number.isFinite(diffMs)) return "";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round(
    (startOfDay(now) - startOfDay(then)) / 86_400_000,
  );
  if (days === 1) return "Yesterday";
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: "short" });

  return then.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Total unread across the inbox — drives the badge on the Coaching tab. */
export function totalUnread(items: CoachingInboxItem[]): number {
  return items.reduce((sum, i) => sum + i.unread, 0);
}
