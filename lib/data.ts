/**
 * The data model, hand-written for the demo.
 *
 * Production's `lib/data.ts` is the Supabase read/write layer, and its types are
 * aliases of a 1,200-line generated schema file carrying roughly twenty columns
 * the interface never reads. This keeps the TYPE NAMES and only the fields the
 * UI actually renders, so every copied component imports `@/lib/data`
 * unchanged.
 *
 * There are no queries here. Reads are selectors over the demo store
 * (`lib/demo/store.ts`); writes are actions on it.
 */

export type CallStatus =
  | "created"
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "summarizing"
  | "ready"
  | "failed"
  | "deleted";

export interface Call {
  id: string;
  name: string;
  recorded_at: string;
  recorded_by: string;
  duration_seconds: number | null;
  status: CallStatus;
  error_message: string | null;
  notes: string | null;
}

export interface CallSummary {
  call_id: string;
  participants_context: string | null;
  summary: string | null;
  /** Json columns in production; already coerced to string arrays here. */
  main_takeaways: string[];
  next_steps: string[];
}

export interface ConversationAnalysis {
  call_id: string;
  outcome: string | null;
  primary_improvement: string | null;
  /** Free-form insights payload — see `Insights` in lib/calls/detail.ts. */
  result: unknown;
}

export interface Comment {
  id: string;
  call_id: string;
  author_user_id: string;
  target_rep_user_id: string;
  body: string;
  /** Playback offset this message is anchored to, if any. */
  timestamp_ms: number | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Utterance {
  id: string;
  call_id: string;
  /** Diarization label: "A", "B", … exactly as the transcription service emits. */
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
  sequence_number: number;
}

export interface ConversationDetail {
  call: Call;
  summary: CallSummary | null;
  analysis: ConversationAnalysis | null;
  comments: Comment[];
  utterances: Utterance[];
  /**
   * Null in the demo unless a real file is dropped into `assets/audio` — the
   * Recording pane runs on a simulated clock instead. See
   * `hooks/use-simulated-player.ts`.
   */
  audioUrl: string | null;
}

/* --- Result shapes, kept identical to production so call sites match. --- */

export type PatchResult = { ok: true } | { ok: false; error: string };

export type RenameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export type PostCommentResult =
  | { ok: true; comment: Comment }
  | { ok: false; error: string };
