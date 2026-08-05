/**
 * Local recording + upload state, persisted in SQLite (outside React state) so a
 * recording survives screen lock, backgrounding, app kill, and relaunch.
 */

/** Lifecycle of the capture itself. */
export type RecordingState =
  | "recording"
  | "paused"
  | "stopped" // finished cleanly, file on disk
  | "interrupted" // app died / audio session lost mid-record
  | "discarded";

/**
 * Lifecycle of getting the file to the server. Mirrors the visible states in the
 * architecture doc; the network execution lands in Phase 4.
 */
export type UploadState =
  | "not_ready" // still recording
  | "saved_local" // file finalized on device, not yet queued
  | "queued" // waiting for connection / worker
  | "uploading"
  | "upload_failed"
  | "uploaded" // object confirmed in Storage
  | "processing" // server transcribing / analyzing
  | "ready"
  | "processing_failed";

/** Upload states that still need work from the queue. */
export const PENDING_UPLOAD_STATES: UploadState[] = [
  "saved_local",
  "queued",
  "uploading",
  "upload_failed",
];

export interface LocalRecording {
  /** Client-generated id; also the idempotency key sent to the server. */
  id: string;
  /** Server conversation (calls.id) once reserved. */
  conversationId: string | null;
  organizationId: string;
  userId: string;
  name: string;
  startedAt: number; // epoch ms
  endedAt: number | null; // epoch ms
  durationMs: number;
  fileUri: string | null;
  mimeType: string;
  sizeBytes: number | null;
  storagePath: string | null;
  recordingState: RecordingState;
  uploadState: UploadState;
  retryCount: number;
  lastError: string | null;
  /**
   * Free-form notes the rep typed while recording. Local-only for now — the
   * server has no notes column, so these are not uploaded or visible to
   * managers. Shown back on the call detail screen.
   */
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Fields required to open a new local recording. */
export type NewLocalRecording = Pick<
  LocalRecording,
  "id" | "organizationId" | "userId" | "name" | "startedAt" | "mimeType"
>;
