# Optional real audio

Empty on purpose. The demo drives the scrubber, the position readout and the
transcript highlighting from a simulated clock (`hooks/use-simulated-player.ts`),
so no audio file is needed.

Keeping it that way is what lets this app run in Expo Go with zero native
modules. Wiring up real playback means adding `expo-audio` back, which forces a
custom dev build — see the README.

If you do want it: drop a file here, map it in `AUDIO_OVERRIDES` in
`lib/demo/timings.ts`, add `expo-audio`, and swap `useSimulatedPlayer` for
`useAudioPlayer` in `app/call/[id].tsx`. The two expose the same shape on
purpose. Note the transcript timings in `lib/demo/content.ts` are written for
the simulated durations and will drift against a real recording.
