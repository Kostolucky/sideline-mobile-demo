import type { Utterance } from "@/lib/data";

/**
 * Shape the analysis pipeline writes into `conversation_analyses.result`.
 * Everything is optional — the column is free-form JSON and older rows may
 * predate any given field.
 */
export interface Insights {
  primary_improvement?: { area?: string; suggestion?: string };
  strengths?: string[];
  next_steps?: string[];
  customer_follow_up_draft?: string;
  outcome?: string;
}

export function parseInsights(result: unknown): Insights | null {
  return result && typeof result === "object" ? (result as Insights) : null;
}

/** `main_takeaways` / `next_steps` are Json columns; coerce defensively. */
export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}

/**
 * AssemblyAI diarization labels speakers "A", "B", "C"… with no idea who is
 * who. The mockup shows named roles, so we approximate: whoever speaks first
 * is treated as the rep (they open the conversation in a door-knock), and
 * everyone else is a customer-side voice.
 *
 * This is a heuristic, not ground truth — it will be wrong when the customer
 * speaks first. Real attribution would need enrolment or a speaker-ID step.
 */
export function buildSpeakerLabels(
  utterances: Utterance[],
): Record<string, string> {
  const order: string[] = [];
  for (const u of utterances) {
    if (!order.includes(u.speaker)) order.push(u.speaker);
  }

  const labels: Record<string, string> = {};
  order.forEach((speaker, i) => {
    if (i === 0) labels[speaker] = "Sales Rep";
    else if (i === 1) labels[speaker] = "Customer";
    else labels[speaker] = `Customer ${i}`;
  });
  return labels;
}

/** True for the voice we treat as the rep — highlighted in brand green. */
export function isRepSpeaker(
  speaker: string,
  labels: Record<string, string>,
): boolean {
  return labels[speaker] === "Sales Rep";
}

/** mm:ss from milliseconds, matching the mockup's `formatClock`. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** "Thursday, May 28 · 10:42 AM" for the detail screen's date chip. */
export function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
