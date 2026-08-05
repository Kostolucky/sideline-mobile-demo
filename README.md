# Sideline Mobile Demo

A front-end-only recreation of the Sideline mobile app, for sales demos.

It looks and behaves like the real thing. It is not the real thing.

**No sign-in. No backend. No database. No environment variables. No API keys.**
Everything on screen comes from `lib/demo/`. Recording, uploading, transcription
and AI analysis are all simulated on a timer.

---

## Run it

```bash
npm install
npx expo start --ios
```

That boots Metro and opens the app in the iOS Simulator via Expo Go. First run
downloads Expo Go into the simulator, which takes a minute.

If the simulator doesn't come to the front, press `i` in the Metro terminal.

Checks:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint
```

### Why there's no build step

The demo deliberately uses **zero native modules** — no `expo-audio`, no
`expo-sqlite`, no `expo-file-system`, no Supabase. Everything it needs is
already inside the Expo Go binary. That means no CocoaPods, no `pod install`,
no `expo prebuild`, no Xcode project, and no dev build. `npx expo start --ios`
is the whole workflow.

Adding any native module back would undo that, so think twice before installing
one.

> Known simulator quirk: `xcrun simctl openurl` with the LAN URL can time out.
> `--localhost` avoids it. If Expo Go bounces back to its home screen, tap
> **Sideline Demo** under "Recently opened".

---

## What's real and what's simulated

| Area | Behaviour |
|---|---|
| Call feed | Real. 12 calls plus 2 device-only rows, grouped by date. |
| Date grouping | Real, and relative to today — always shows "Today"/"Yesterday". |
| Admin / User roles | Real. Switch personas in the account sheet. |
| Recording | **Simulated.** A timer, not a microphone. |
| Upload → processing → ready | **Simulated.** ~12s scripted pipeline after you tap End. |
| Playback | **Simulated.** A clock drives the scrubber and transcript highlighting. |
| Transcript, summary, coaching | Real content, hardcoded. Nothing is generated. |
| Coaching messages you send | Real, stored in memory for the session. |
| Unread badges | Real, per-persona. One message arrives ~20s in, on purpose. |

State lives in memory. **Reload the app and the sample data is pristine again** —
which is what you want between demos. There is also a *Reset demo data* button
in the account sheet.

---

## Where things live

```
lib/demo/content.ts   ← THE SAMPLE DATA. Edit this to change the demo.
lib/demo/store.ts     ← state + selectors + actions (replaces Supabase/SQLite/upload queue)
lib/demo/timings.ts   ← every simulated delay, in one place
lib/demo/pipeline.ts  ← the scripted upload→processing→ready sequence
constants/tokens.ts   ← the entire design system (dark-only)
hooks/                ← simulated player, fake recorder
components/           ← copied from production, almost entirely unchanged
```

`lib/demo/content.ts` is **byte-identical to the same file in
`sideline-web-demo`**, so the same call opens on the phone and on the web with
the same rep, title and transcript. If you edit one, copy it to the other.

### Changing the sample data

Open `lib/demo/content.ts`. Everything is plain objects — people, calls,
dialogue, summaries, coaching threads. Times are relative (`daysAgo`, `hour`,
`minute`) and resolved at load, so the feed never goes stale.

### Changing the pacing

`lib/demo/timings.ts`. Nothing else hardcodes a delay.

---

## Relationship to production

Copied unchanged from `sideline-mobile-app-mvp`: `constants/tokens.ts`, all of
`components/ui/`, most of `components/sideline/`, and the pure logic in
`lib/format.ts` and `lib/calls/`.

Deliberately **not** copied: Supabase, auth, the SQLite manifest, the upload
queue, `expo-audio`, EAS config, and every `.env`.

Two intentional differences from production:

- **The sign-in screen is restyled onto the design tokens.** Production's is the
  one screen that predates the token system and still uses hardcoded blues.
  Reproducing that would look like a bug here.
- **There is no red recording UI**, matching production: a red `record` token is
  declared in `tokens.ts` but never used — the shipped recording bar is green.
