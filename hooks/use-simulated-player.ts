import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** How often the clock advances. 100ms keeps the scrubber smooth. */
const TICK_MS = 100;

/**
 * Playback status, matching the fields `expo-audio`'s `useAudioPlayerStatus`
 * exposes and the UI actually reads.
 */
export interface SimulatedPlayerStatus {
  currentTime: number;
  duration: number;
  playing: boolean;
}

/** The player surface `DetailRecording` consumes. */
export interface SimulatedPlayer {
  play: () => void;
  pause: () => void;
  /** Seconds, matching `expo-audio`'s signature. */
  seekTo: (seconds: number) => void;
}

/**
 * A stand-in for `useAudioPlayer` + `useAudioPlayerStatus`.
 *
 * There is no audio file in this demo, and adding `expo-audio` back would be
 * the single thing forcing a custom dev build — with it gone, the app runs in
 * Expo Go with no native modules at all. So a timer advances a position against
 * the call's known duration, and everything downstream (the scrubber, the
 * position readout, transcript highlighting and auto-follow, and seeking from a
 * timestamped coaching message) behaves exactly as it would with real audio.
 *
 * The shape is deliberately identical to expo-audio's, so swapping a real
 * player back in is a two-line change in `app/call/[id].tsx`.
 */
export function useSimulatedPlayer(durationSeconds: number): {
  player: SimulatedPlayer;
  status: SimulatedPlayerStatus;
} {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const duration = Math.max(0, durationSeconds);
  const durationRef = useRef(duration);
  durationRef.current = duration;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + TICK_MS / 1000;
        if (next >= durationRef.current) {
          setPlaying(false);
          return durationRef.current;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const play = useCallback(() => {
    // Restarting from the end is friendlier than a dead play button.
    setCurrentTime((prev) => (prev >= durationRef.current ? 0 : prev));
    setPlaying(true);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(Math.max(0, Math.min(seconds, durationRef.current)));
  }, []);

  const player = useMemo<SimulatedPlayer>(
    () => ({ play, pause, seekTo }),
    [play, pause, seekTo],
  );

  return { player, status: { currentTime, duration, playing } };
}
