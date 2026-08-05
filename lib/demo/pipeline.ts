/**
 * The scripted upload → processing → ready pipeline.
 *
 * Production does the real thing: a durable SQLite upload queue, a signed-URL
 * PUT straight to storage with retry and backoff, then AssemblyAI transcription
 * and an OpenAI summary, with the client polling `calls.status` until it flips.
 * That takes minutes and costs money.
 *
 * This walks a new recording through the same visible states on a timeline —
 * the same `uploadState` values the feed already knows how to label — and then
 * attaches pre-authored content so the finished call opens onto something real.
 *
 * Every duration comes from `timings.ts`.
 */

import { FRESH_CALL_CONTENT } from "./content";
import { TIMINGS } from "./timings";
import { attachFreshContent, getState, updateRecording } from "./store";
import type { Call, CallSummary, ConversationAnalysis, Utterance } from "@/lib/data";

export function runRecordingPipeline(localId: string): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (ms: number, fn: () => void) => {
    timers.push(setTimeout(fn, ms));
  };

  const { queuedMs, uploadingMs, uploadedMs, processingMs } = TIMINGS.pipeline;

  at(0, () => updateRecording(localId, { uploadState: "saved_local" }));
  at(queuedMs * 0.5, () => updateRecording(localId, { uploadState: "queued" }));
  at(queuedMs, () => updateRecording(localId, { uploadState: "uploading" }));

  const uploadedAt = queuedMs + uploadingMs;
  at(uploadedAt, () => updateRecording(localId, { uploadState: "uploaded" }));

  const processingAt = uploadedAt + uploadedMs;
  at(processingAt, () => updateRecording(localId, { uploadState: "processing" }));

  at(processingAt + processingMs, () => {
    const recording = getState().recordings.find((r) => r.id === localId);
    if (!recording) return;

    const callId = `call-${localId}`;
    const c = FRESH_CALL_CONTENT;
    const recordedAt = new Date(recording.startedAt).toISOString();

    const call: Call = {
      id: callId,
      name: recording.name,
      recorded_at: recordedAt,
      recorded_by: recording.userId,
      duration_seconds: Math.round(recording.durationMs / 1000),
      status: "ready",
      error_message: null,
      notes: recording.notes,
    };

    const utterances: Utterance[] = c.utterances.map((u, i) => ({
      id: `${callId}-u${i}`,
      call_id: callId,
      speaker: u.speaker,
      start_ms: u.startMs,
      end_ms: u.endMs,
      text: u.text,
      sequence_number: i,
    }));

    const summary: CallSummary = {
      call_id: callId,
      participants_context: c.summary.participantsContext,
      summary: c.summary.summary,
      main_takeaways: c.summary.mainTakeaways,
      next_steps: c.summary.nextSteps,
    };

    const analysis: ConversationAnalysis = {
      call_id: callId,
      outcome: c.insights.outcome,
      primary_improvement: c.insights.primaryImprovement.area,
      result: {
        outcome: c.insights.outcome,
        strengths: c.insights.strengths,
        primary_improvement: c.insights.primaryImprovement,
        objections: c.insights.objections,
        next_steps: c.insights.nextSteps,
        coaching_note: c.insights.coachingNote,
        customer_follow_up_draft: c.insights.customerFollowUpDraft,
      },
    };

    attachFreshContent(localId, callId, call, utterances, summary, analysis);
  });

  return () => {
    for (const t of timers) clearTimeout(t);
  };
}
