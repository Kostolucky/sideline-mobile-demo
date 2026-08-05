import type { MemberRole } from "@/lib/auth";
import type { Comment } from "@/lib/data";

/**
 * Shaping for the Coaching thread — a direct conversation between the Admin and
 * the rep about one call.
 *
 * Human messages only. Analysis output is deliberately absent: coaching here is
 * something a person said to another person, and mixing generated suggestions
 * into that thread muddies who is actually talking.
 *
 * Pure and free of React Native imports so the ordering, sidedness and role copy
 * are unit-testable without rendering anything.
 */

export interface CoachingMessage {
  kind: "message";
  id: string;
  /** Sent by the signed-in person — rendered on the right. */
  mine: boolean;
  /** Who sent it. Null for your own messages, where the side already says so. */
  authorName: string | null;
  body: string;
  /** "9:14 AM" */
  time: string;
  /** Playback offset this message is anchored to, if any. */
  timestampMs: number | null;
}

export interface CoachingDayBreak {
  kind: "day";
  id: string;
  label: string;
}

export type CoachingItem = CoachingMessage | CoachingDayBreak;

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today" / "Yesterday" / "Thursday, May 28". `now` is injectable for tests. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const dayMs = 86_400_000;
  const diff = (startOfDay(now) - startOfDay(then)) / dayMs;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return then.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * The human conversation, oldest first, with a day break wherever the calendar
 * date changes. Newest ends up last so the view can open at the bottom, the way
 * a messaging app does.
 */
export function buildCoachingThread(
  comments: Comment[],
  options: {
    viewerId: string | null;
    /** auth user id -> display name, from the workspace member list. */
    namesByUserId: Record<string, string>;
    /** The rep this call belongs to, used only for a name fallback. */
    callOwnerId: string;
    now?: Date;
  },
): CoachingItem[] {
  const { viewerId, namesByUserId, callOwnerId, now } = options;

  const ordered = [...comments].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );

  const items: CoachingItem[] = [];
  let lastDay: number | null = null;

  for (const c of ordered) {
    const created = new Date(c.created_at);
    const day = startOfDay(created);
    if (day !== lastDay) {
      items.push({
        kind: "day",
        id: `day-${day}`,
        label: dayLabel(c.created_at, now),
      });
      lastDay = day;
    }

    const mine = !!viewerId && c.author_user_id === viewerId;
    items.push({
      kind: "message",
      id: c.id,
      mine,
      authorName: mine
        ? null
        : (namesByUserId[c.author_user_id] ??
          (c.author_user_id === callOwnerId ? "Rep" : "Coach")),
      body: c.body,
      time: timeLabel(c.created_at),
      timestampMs: c.timestamp_ms,
    });
  }

  return items;
}

/** Composer prompt. An Admin opens the conversation; a User answers one. */
export function composerPlaceholder(role: MemberRole): string {
  return role === "admin" ? "Ask a question or leave coaching…" : "Reply…";
}

export interface EmptyCopy {
  title: string;
  body: string;
}

/** What an untouched thread says — an Admin can act, a User is waiting. */
export function emptyCopy(role: MemberRole): EmptyCopy {
  return role === "admin"
    ? {
        title: "No coaching yet",
        body: "Ask a question or leave feedback for this rep.",
      }
    : {
        title: "No coaching yet",
        body: "Feedback from your manager will appear here.",
      };
}
