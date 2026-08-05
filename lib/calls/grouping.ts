import type { LocalRecording, UploadState } from "@/lib/recording/types";

export interface DateGroup {
  /** Stable YYYY-MM-DD key, used for sorting and as the list key. */
  dateKey: string;
  /** Human heading, e.g. "Thursday, May 28". */
  dateLabel: string;
  items: LocalRecording[];
}

/** Local-time YYYY-MM-DD. Deliberately not `toISOString`, which is UTC and
 *  would push late-evening calls into the following day. */
export function dateKeyOf(epochMs: number): string {
  const d = new Date(epochMs);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function dateLabelOf(epochMs: number, now = new Date()): string {
  const d = new Date(epochMs);
  const todayKey = dateKeyOf(now.getTime());
  const yesterdayKey = dateKeyOf(now.getTime() - 24 * 60 * 60 * 1000);
  const key = dateKeyOf(epochMs);

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Groups recordings into date sections, newest day first and newest call first
 * within each day. Mirrors the mockup's feed: only days that actually have
 * calls produce a heading — there is no placeholder for an empty today.
 */
export function groupByDate(
  recordings: LocalRecording[],
  now = new Date(),
): DateGroup[] {
  const map = new Map<string, LocalRecording[]>();
  for (const r of recordings) {
    const key = dateKeyOf(r.startedAt);
    const bucket = map.get(key);
    if (bucket) bucket.push(r);
    else map.set(key, [r]);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, items]) => ({
      dateKey,
      dateLabel: dateLabelOf(items[0].startedAt, now),
      items: [...items].sort((a, b) => b.startedAt - a.startedAt),
    }));
}

/**
 * Secondary line on a call row. The mockup shows the name alone, but dropping
 * upload/processing state entirely would lose the durability affordances the
 * capture pipeline depends on — so non-ready calls get a muted status line.
 * `null` means "ready, show nothing" and matches the mockup exactly.
 */
export function statusLabel(r: LocalRecording): string | null {
  if (r.recordingState === "interrupted") return "Interrupted — tap to retry";

  const labels: Partial<Record<UploadState, string>> = {
    not_ready: "In progress",
    saved_local: "Saved on device",
    queued: "Waiting to upload",
    uploading: "Uploading",
    upload_failed: "Upload failed — tap to retry",
    uploaded: "Uploaded",
    processing: "Processing",
    processing_failed: "Processing failed — tap to retry",
  };
  return labels[r.uploadState] ?? null;
}

/** A call can only be opened once the server has a transcript + summary. */
export function isOpenable(r: LocalRecording): boolean {
  return r.uploadState === "ready" && !!r.conversationId;
}
