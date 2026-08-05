import { useCallback, useEffect, useRef, useState } from "react";

import { createRecording, deleteRecording, updateRecording } from "@/lib/demo/store";
import { suggestedRecordingName } from "@/lib/format";

/**
 * Capture phases.
 *
 * Production also has a `denied` phase for a refused microphone permission.
 * There is no microphone here, so there is no permission to refuse — and a
 * dead-end error screen is not somewhere a demo should be able to wander into.
 */
export type RecorderPhase = "recording" | "paused" | "finalizing";

/**
 * A stand-in for `useRecorder`, which wraps `expo-audio` in production.
 *
 * Same surface, minus everything native: a timer counts up, and a row is opened
 * in the store the moment capture begins — exactly as production writes a
 * SQLite row before the first byte of audio, so a recording survives the app
 * dying mid-capture.
 *
 * Recording starts immediately on mount, matching production: the green FAB on
 * the feed *is* the start action, so arriving here already means "go".
 */
export function useFakeRecorder(): {
  phase: RecorderPhase;
  durationMillis: number;
  recordingId: string | null;
  isRecording: boolean;
  pause: () => void;
  resume: () => void;
  finish: () => { id: string; durationMs: number } | null;
  discard: () => void;
} {
  const [phase, setPhase] = useState<RecorderPhase>("recording");
  const [durationMillis, setDurationMillis] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const idRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  // Open the local row once, on mount, before any "audio" is captured.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const id = createRecording(suggestedRecordingName());
    idRef.current = id;
    setRecordingId(id);
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setDurationMillis((ms) => ms + 250), 250);
    return () => clearInterval(timer);
  }, [phase]);

  const pause = useCallback(() => {
    setPhase("paused");
    if (idRef.current) updateRecording(idRef.current, { recordingState: "paused" });
  }, []);

  const resume = useCallback(() => {
    setPhase("recording");
    if (idRef.current) updateRecording(idRef.current, { recordingState: "recording" });
  }, []);

  const finish = useCallback(() => {
    const id = idRef.current;
    if (!id) return null;
    setPhase("finalizing");
    const durationMs = durationMillis;
    updateRecording(id, {
      recordingState: "stopped",
      uploadState: "saved_local",
      endedAt: Date.now(),
      durationMs,
      // A plausible size for an AAC-LC mono 16kHz ~32kbps file.
      sizeBytes: Math.round((durationMs / 1000) * 4_000),
      fileUri: `file:///demo/${id}.m4a`,
    });
    return { id, durationMs };
  }, [durationMillis]);

  const discard = useCallback(() => {
    const id = idRef.current;
    if (id) deleteRecording(id);
    idRef.current = null;
  }, []);

  return {
    phase,
    durationMillis,
    recordingId,
    isRecording: phase === "recording",
    pause,
    resume,
    finish,
    discard,
  };
}
