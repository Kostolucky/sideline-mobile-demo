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
 */

import type {
  Call,
  CallSummary,
  Comment,
  ConversationAnalysis,
  ConversationDetail,
  Utterance,
} from "@/lib/data";
import type { LocalRecording } from "@/lib/recording/types";
import type { MemberRole } from "@/lib/auth";
import {
  CALLS,
  LOCAL_ONLY_RECORDINGS,
  DEFAULT_PERSONA_ID,
  ORGANIZATION,
  PEOPLE,
  atDaysAgo,
  isoDaysAgo,
  type DemoCall,
} from "./content";
import { AUDIO_OVERRIDES } from "./timings";

export interface DemoMember {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
}

export interface DemoState {
  /** Whose eyes we are looking through. Drives every permission in the UI. */
  personaId: string;
  organizationId: string;
  members: DemoMember[];
  /** The feed. Mirrors what the SQLite manifest holds in production. */
  recordings: LocalRecording[];
  calls: Record<string, Call>;
  summaries: Record<string, CallSummary>;
  analyses: Record<string, ConversationAnalysis>;
  utterances: Record<string, Utterance[]>;
  comments: Comment[];
  /** `${userId}::${callId}` -> ISO read watermark. Per-person, like production. */
  coachingReads: Record<string, string>;
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

/**
 * Two rows that exist only on the device and never reached the server.
 *
 * They are here so the failure labels — "Upload failed — tap to retry" and
 * "Interrupted — tap to retry" — are reachable on the feed immediately, without
 * having to break something to see them.
 */
function localOnlyRecordings(): LocalRecording[] {
  return LOCAL_ONLY_RECORDINGS.map((r) => {
    const startedAt = atDaysAgo(r.daysAgo, r.hour, r.minute);
    const durationMs = r.durationSeconds * 1000;
    const interrupted = r.kind === "interrupted";
    return {
      id: r.id,
      conversationId: null,
      organizationId: ORGANIZATION.id,
      userId: r.repId,
      name: r.name,
      startedAt,
      endedAt: interrupted ? null : startedAt + durationMs,
      durationMs,
      fileUri: `file:///demo/${r.id}.m4a`,
      mimeType: "audio/mp4",
      sizeBytes: Math.round(r.durationSeconds * 4_000),
      storagePath: null,
      recordingState: interrupted ? ("interrupted" as const) : ("stopped" as const),
      uploadState: interrupted ? ("saved_local" as const) : ("upload_failed" as const),
      retryCount: interrupted ? 0 : 2,
      lastError: interrupted ? null : "Network request failed",
      notes: null,
      createdAt: startedAt,
      updatedAt: startedAt + durationMs,
    };
  });
}

export function buildInitialState(): DemoState {
  const calls: Record<string, Call> = {};
  const summaries: Record<string, CallSummary> = {};
  const analyses: Record<string, ConversationAnalysis> = {};
  const utterances: Record<string, Utterance[]> = {};
  const comments: Comment[] = [];

  for (const call of CALLS) {
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
          coaching_note: call.insights.coachingNote,
          customer_follow_up_draft: call.insights.customerFollowUpDraft,
        },
      };
    }

    for (const c of call.comments) {
      const iso = isoDaysAgo(c.daysAgo, c.hour, c.minute);
      comments.push({
        id: c.id,
        call_id: call.id,
        author_user_id: c.authorId,
        target_rep_user_id: call.repId,
        body: c.body,
        timestamp_ms: c.timestampMs,
        parent_id: c.parentId,
        created_at: iso,
        updated_at: iso,
      });
    }
  }

  comments.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

  const recordings = [
    ...CALLS.map(toRecording),
    ...localOnlyRecordings(),
  ].sort((a, b) => b.startedAt - a.startedAt);

  return {
    personaId: DEFAULT_PERSONA_ID,
    organizationId: ORGANIZATION.id,
    members: PEOPLE.map((p) => ({
      userId: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
    })),
    recordings,
    calls,
    summaries,
    analyses,
    utterances,
    comments,
    coachingReads: seedReads(),
  };
}

/**
 * Seed read watermarks so some coaching starts unread and some doesn't.
 *
 * Everyone has "read up to 36 hours ago", which leaves anything written since
 * then unread to whoever didn't write it. That's how the feed has visible
 * badges on first paint without hand-marking individual rows.
 */
function seedReads(): Record<string, string> {
  const watermark = new Date(Date.now() - 36 * 3_600_000).toISOString();
  const reads: Record<string, string> = {};
  for (const person of PEOPLE) {
    for (const call of CALLS) {
      reads[`${person.id}::${call.id}`] = watermark;
    }
  }
  return reads;
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

export function currentMember(s: DemoState = state): DemoMember {
  return s.members.find((m) => m.userId === s.personaId) ?? s.members[0];
}

export function isAdmin(s: DemoState = state): boolean {
  return currentMember(s).role === "admin";
}

/**
 * What this persona is allowed to see.
 *
 * Production enforces this in the database (RLS), so a rep's feed simply comes
 * back with their own calls and there is no client-side filter to copy. With no
 * database, that scoping has to live here — this is the one place it happens.
 * The Admin rep filter (`filterByRep`) narrows this further, and can only ever
 * narrow.
 */
export function visibleRecordings(s: DemoState = state): LocalRecording[] {
  if (isAdmin(s)) return s.recordings;
  return s.recordings.filter((r) => r.userId === s.personaId);
}

export function namesByUserId(s: DemoState = state): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of s.members) out[m.userId] = m.name;
  return out;
}

export function getConversationDetail(
  callId: string,
  s: DemoState = state,
): ConversationDetail | null {
  const call = s.calls[callId];
  if (!call) return null;
  // Respect the same scoping the feed uses — a rep deep-linked into someone
  // else's call should get the "not found" state, as they would in production.
  if (!isAdmin(s) && call.recorded_by !== s.personaId) return null;

  return {
    call,
    summary: s.summaries[callId] ?? null,
    analysis: s.analyses[callId] ?? null,
    comments: s.comments
      .filter((c) => c.call_id === callId)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
    utterances: s.utterances[callId] ?? [],
    audioUrl: AUDIO_OVERRIDES[callId] ?? null,
  };
}

/** call id -> unread coaching count for the current persona. */
export function unreadCoachingCounts(s: DemoState = state): Record<string, number> {
  const visible = new Set(
    visibleRecordings(s)
      .map((r) => r.conversationId)
      .filter((id): id is string => !!id),
  );
  const out: Record<string, number> = {};

  for (const c of s.comments) {
    if (!visible.has(c.call_id)) continue;
    // Never tell people their own message is news to them.
    if (c.author_user_id === s.personaId) continue;
    const lastRead = s.coachingReads[`${s.personaId}::${c.call_id}`];
    if (!lastRead || Date.parse(c.created_at) > Date.parse(lastRead)) {
      out[c.call_id] = (out[c.call_id] ?? 0) + 1;
    }
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Mutations                                                                  */
/* ------------------------------------------------------------------------ */

export function setPersona(personaId: string): void {
  update({ personaId });
}

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

export function addComment(
  callId: string,
  body: string,
  timestampMs: number | null,
): Comment {
  const call = state.calls[callId];
  const iso = new Date().toISOString();
  const comment: Comment = {
    id: nextId("cm"),
    call_id: callId,
    author_user_id: state.personaId,
    target_rep_user_id: call?.recorded_by ?? state.personaId,
    body: body.trim(),
    timestamp_ms: timestampMs,
    parent_id: null,
    created_at: iso,
    updated_at: iso,
  };
  update({ comments: [...state.comments, comment] });
  return comment;
}

/** Inject a message from someone else — the scripted "incoming coaching". */
export function injectIncomingComment(
  callId: string,
  authorId: string,
  body: string,
): void {
  const call = state.calls[callId];
  if (!call) return;
  const iso = new Date().toISOString();
  update({
    comments: [
      ...state.comments,
      {
        id: nextId("cm-incoming"),
        call_id: callId,
        author_user_id: authorId,
        target_rep_user_id: call.recorded_by,
        body,
        timestamp_ms: null,
        parent_id: null,
        created_at: iso,
        updated_at: iso,
      },
    ],
  });
}

export function markCoachingRead(callId: string, upTo: string): void {
  update({
    coachingReads: {
      ...state.coachingReads,
      [`${state.personaId}::${callId}`]: upTo,
    },
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
        userId: state.personaId,
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
