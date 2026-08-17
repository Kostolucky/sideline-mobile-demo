/**
 * The demo store.
 *
 * A plain observable module singleton with `subscribe`/`getState`, read through
 * `useSyncExternalStore` in `use-demo.ts`. Deliberately the same shape as the
 * web demo's store, so the two repos stay easy to reason about side by side.
 *
 * This replaces three things at once from production: the Supabase reads in
 * `lib/data.ts`, the SQLite manifest in `lib/recording/store.ts`, and the upload
 * queue in `lib/upload/service.ts`. State is in memory only — a reload restores
 * the pristine fixtures, which is what you want between demos, and
 * `resetDemo()` does the same thing mid-session.
 *
 * ONE PERSON LIVES HERE. The phone is a sales rep's personal workspace: it
 * holds the calls they recorded and nothing else. There is no persona to
 * switch, no roster, and no manager view — reviewing a team's calls is the web
 * app's job. So the store is seeded from the narrative filtered to
 * `REP_PERSON_ID`, and every screen can assume the current user owns whatever
 * it is showing.
 */

import type {
  Call,
  CallSummary,
  ConversationAnalysis,
  ConversationDetail,
  Utterance,
} from "@/lib/data";
import type { LocalRecording } from "@/lib/recording/types";
import {
  CALLS,
  ORGANIZATION,
  REP_PERSON_ID,
  atDaysAgo,
  personById,
  type DemoCall,
} from "./content";
import { AUDIO_OVERRIDES } from "./timings";

export interface DemoUser {
  userId: string;
  name: string;
  email: string;
}

export interface DemoState {
  /** The rep using the app. The only person this client knows about. */
  user: DemoUser;
  organizationId: string;
  /** The feed. Mirrors what the SQLite manifest holds in production. */
  recordings: LocalRecording[];
  calls: Record<string, Call>;
  summaries: Record<string, CallSummary>;
  analyses: Record<string, ConversationAnalysis>;
  utterances: Record<string, Utterance[]>;
}

/* ------------------------------------------------------------------------ */
/* Building initial state from the canonical narrative                        */
/* ------------------------------------------------------------------------ */

function statusOf(call: DemoCall): Call["status"] {
  if (call.status === "ready") return "ready";
  if (call.status === "failed") return "failed";
  return "transcribing";
}

/**
 * `uploadState` is what the feed actually renders — it drives the status line
 * and whether a row can be opened at all (`isOpenable`).
 */
function uploadStateOf(call: DemoCall): LocalRecording["uploadState"] {
  if (call.status === "ready") return "ready";
  if (call.status === "failed") return "processing_failed";
  return "processing";
}

function toRecording(call: DemoCall): LocalRecording {
  const startedAt = atDaysAgo(call.daysAgo, call.hour, call.minute);
  const durationMs = call.durationSeconds * 1000;
  return {
    id: call.id,
    conversationId: call.id,
    organizationId: ORGANIZATION.id,
    userId: call.repId,
    name: call.name,
    startedAt,
    endedAt: startedAt + durationMs,
    durationMs,
    // Production deletes the local file once the server confirms "ready".
    fileUri: null,
    mimeType: "audio/mp4",
    sizeBytes: Math.round(call.durationSeconds * 4_000),
    storagePath: `demo/${call.id}/audio.m4a`,
    recordingState: "stopped",
    uploadState: uploadStateOf(call),
    retryCount: 0,
    lastError: call.errorMessage ?? null,
    notes: call.notes ?? null,
    createdAt: startedAt,
    updatedAt: startedAt + durationMs,
  };
}

function currentUser(): DemoUser {
  const person = personById(REP_PERSON_ID);
  // The narrative always contains this person; the fallback keeps the store
  // total rather than throwing during module load.
  return {
    userId: REP_PERSON_ID,
    name: person?.name ?? "Sales Rep",
    email: person?.email ?? "rep@example.com",
  };
}

export function buildInitialState(): DemoState {
  const calls: Record<string, Call> = {};
  const summaries: Record<string, CallSummary> = {};
  const analyses: Record<string, ConversationAnalysis> = {};
  const utterances: Record<string, Utterance[]> = {};

  // Only this rep's own work reaches the phone.
  const mine = CALLS.filter((c) => c.repId === REP_PERSON_ID);

  for (const call of mine) {
    calls[call.id] = {
      id: call.id,
      name: call.name,
      recorded_at: new Date(
        atDaysAgo(call.daysAgo, call.hour, call.minute),
      ).toISOString(),
      recorded_by: call.repId,
      duration_seconds: call.durationSeconds,
      status: statusOf(call),
      error_message: call.errorMessage ?? null,
      notes: call.notes ?? null,
    };

    utterances[call.id] = call.utterances.map((u, i) => ({
      id: `${call.id}-u${i}`,
      call_id: call.id,
      speaker: u.speaker,
      start_ms: u.startMs,
      end_ms: u.endMs,
      text: u.text,
      sequence_number: i,
    }));

    if (call.summary) {
      summaries[call.id] = {
        call_id: call.id,
        participants_context: call.summary.participantsContext,
        summary: call.summary.summary,
        main_takeaways: call.summary.mainTakeaways,
        next_steps: call.summary.nextSteps,
      };
    }

    if (call.insights) {
      analyses[call.id] = {
        call_id: call.id,
        outcome: call.insights.outcome,
        primary_improvement: call.insights.primaryImprovement.area,
        result: {
          outcome: call.insights.outcome,
          strengths: call.insights.strengths,
          primary_improvement: call.insights.primaryImprovement,
          objections: call.insights.objections,
          next_steps: call.insights.nextSteps,
          customer_follow_up_draft: call.insights.customerFollowUpDraft,
        },
      };
    }
  }

  const recordings = mine.map(toRecording).sort(
    (a, b) => b.startedAt - a.startedAt,
  );

  return {
    user: currentUser(),
    organizationId: ORGANIZATION.id,
    recordings,
    calls,
    summaries,
    analyses,
    utterances,
  };
}

/* ------------------------------------------------------------------------ */
/* The observable                                                             */
/* ------------------------------------------------------------------------ */

type Listener = () => void;

let state: DemoState = buildInitialState();
const listeners = new Set<Listener>();

export function getState(): DemoState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: DemoState): void {
  state = next;
  for (const l of listeners) l();
}

function update(patch: Partial<DemoState>): void {
  commit({ ...state, ...patch });
}

/* ------------------------------------------------------------------------ */
/* Selectors                                                                  */
/* ------------------------------------------------------------------------ */

export function getConversationDetail(
  callId: string,
  s: DemoState = state,
): ConversationDetail | null {
  const call = s.calls[callId];
  if (!call) return null;

  return {
    call,
    summary: s.summaries[callId] ?? null,
    analysis: s.analyses[callId] ?? null,
    utterances: s.utterances[callId] ?? [],
    audioUrl: AUDIO_OVERRIDES[callId] ?? null,
  };
}

/* ------------------------------------------------------------------------ */
/* Mutations                                                                  */
/* ------------------------------------------------------------------------ */

export function resetDemo(): void {
  commit(buildInitialState());
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function renameCall(callId: string, name: string): void {
  const call = state.calls[callId];
  if (!call) return;
  commit({
    ...state,
    calls: { ...state.calls, [callId]: { ...call, name } },
    recordings: state.recordings.map((r) =>
      r.conversationId === callId ? { ...r, name } : r,
    ),
  });
}

export function saveNotes(callId: string, notes: string): void {
  const call = state.calls[callId];
  if (!call) return;
  const trimmed = notes.trim() || null;
  commit({
    ...state,
    calls: { ...state.calls, [callId]: { ...call, notes: trimmed } },
    recordings: state.recordings.map((r) =>
      r.conversationId === callId ? { ...r, notes: trimmed } : r,
    ),
  });
}

/* ---- Recording lifecycle ---- */

/** Open a new local row the moment capture starts, as production does. */
export function createRecording(name: string): string {
  const id = nextId("local");
  const now = Date.now();
  update({
    recordings: [
      {
        id,
        conversationId: null,
        organizationId: state.organizationId,
        userId: state.user.userId,
        name,
        startedAt: now,
        endedAt: null,
        durationMs: 0,
        fileUri: null,
        mimeType: "audio/mp4",
        sizeBytes: null,
        storagePath: null,
        recordingState: "recording",
        uploadState: "not_ready",
        retryCount: 0,
        lastError: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
      ...state.recordings,
    ],
  });
  return id;
}

export function updateRecording(
  id: string,
  patch: Partial<LocalRecording>,
): void {
  update({
    recordings: state.recordings.map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
    ),
  });
}

export function deleteRecording(id: string): void {
  update({ recordings: state.recordings.filter((r) => r.id !== id) });
}

/** Attach the pre-authored content a finished recording resolves into. */
export function attachFreshContent(
  localId: string,
  callId: string,
  call: Call,
  utterances: Utterance[],
  summary: CallSummary,
  analysis: ConversationAnalysis,
): void {
  commit({
    ...state,
    calls: { ...state.calls, [callId]: call },
    utterances: { ...state.utterances, [callId]: utterances },
    summaries: { ...state.summaries, [callId]: summary },
    analyses: { ...state.analyses, [callId]: analysis },
    recordings: state.recordings.map((r) =>
      r.id === localId
        ? {
            ...r,
            conversationId: callId,
            uploadState: "ready",
            // Production reclaims the local file once the server confirms.
            fileUri: null,
            storagePath: `demo/${callId}/audio.m4a`,
            updatedAt: Date.now(),
          }
        : r,
    ),
  });
}
