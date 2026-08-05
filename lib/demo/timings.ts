/**
 * Every simulated duration in the mobile demo, in one place.
 *
 * If a demo feels too slow or too fast in the room, this is the only file to
 * touch — nothing else hardcodes a delay.
 */
export const TIMINGS = {
  /** Pull-to-refresh spinner dwell, so the gesture feels like it did something. */
  refreshMs: 600,

  /** The scripted upload → processing → ready pipeline after a recording. */
  pipeline: {
    queuedMs: 700,
    /** Upload progress ramps 0 → 100 over this long. */
    uploadingMs: 4_000,
    uploadedMs: 600,
    /** "Processing" dwell before the call flips to ready. */
    processingMs: 6_000,
  },

  /**
   * A scripted coaching message arrives this long after the feed is first
   * shown, so an unread badge visibly appears during a demo rather than being
   * there from the start. Set `enabled: false` to switch the surprise off.
   */
  incomingCoaching: {
    enabled: true,
    afterMs: 20_000,
    callId: "call-brennan",
  },
} as const;

/**
 * Real audio, if you have any.
 *
 * The demo drives the scrubber, the timer and the transcript highlighting from
 * a simulated clock, so no audio file is required and none ships with this
 * repo. Keeping it that way is what lets the app run in Expo Go with zero
 * native modules — adding `expo-audio` back would mean a custom dev build.
 *
 * If you do want real playback, drop a file into `assets/audio/`, add
 * `expo-audio`, and swap `useSimulatedPlayer` for `useAudioPlayer` in
 * `app/call/[id].tsx`. The two expose the same shape on purpose.
 */
export const AUDIO_OVERRIDES: Record<string, string> = {};
