# Sideline Mobile Demo

A front-end-only recreation of the Sideline mobile app, for sales demos.

It looks and behaves like the real thing. It is not the real thing.

**The phone is a sales rep's personal workspace**: record a conversation,
review your own calls, keep your own notes. There is no manager view, no role
switch and no way to reach another rep's calls — reviewing a team's calls is
the web app's job (`sideline-web-demo`).

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
| Call feed | Real. The signed-in rep's own calls, grouped by date. |
| Date grouping | Real, and relative to today — always shows "Today"/"Yesterday". |
| Recording | **Simulated.** A timer, not a microphone. |
| Upload → processing → ready | **Simulated.** ~12s scripted pipeline after you tap End. |
| Playback | **Simulated.** A clock drives the scrubber and transcript highlighting. |
| Transcript and summary | Real content, hardcoded. Nothing is generated. |
| Notes and renames | Real, stored in memory for the session. |
| Chat with note | **Simulated.** The reply is the call's authored follow-up draft, streamed in. |

State lives in memory. **Reload the app and the sample data is pristine again** —
which is what you want between demos. There is also a *Reset demo data* button
on the Account screen.

---

## Navigation

There is one destination — the call feed — and everything else is something you
do from it.

```
app/_layout.tsx          root Stack
├── index.tsx            Calls — the rep's own feed, and the landing screen
├── record.tsx           modal, slides up over the feed
├── call/[id].tsx        call detail (Summary / Recording panes)
├── chat/[id].tsx        "Chat with note", opened from a call's Summary pane
├── account.tsx          pushed screen: back arrow
└── (auth)/sign-in.tsx   reachable, never gating
```

There is no tab bar. It used to carry **Calls · Record · Coaching**, which
navigated between one real place, an action, and an inbox that duplicated the
feed. What sits at the bottom of the feed now is what you do next — ask
something, or record something (`HomeFooter`).

**Account is a screen, not a sheet.** It began as a bottom sheet rendered inside
whichever list screen you were on, which put it in the same stacking context as
that screen's `ScrollView` — so the list painted over it and the sheet showed
through the gaps between rows. A pushed screen has no such problem.

**Record is not a destination.** It's an action: the feed pushes `/record` onto
the root stack, so it slides up and closing it returns you to the feed. Making
it a tab would give it navigation state it has no use for, and would let you
wander away from a half-finished recording.

## Where things live

```
lib/demo/content.ts        ← THE SAMPLE DATA. Edit this to change the demo.
lib/demo/store.ts          ← state + selectors + actions (replaces Supabase/SQLite/upload queue)
lib/demo/timings.ts        ← every simulated delay, in one place
lib/demo/pipeline.ts       ← the scripted upload→processing→ready sequence
constants/tokens.ts        ← the entire design system (dark-only)
hooks/                     ← simulated player, fake recorder
components/sideline/
  app-header.tsx           ← wordmark + avatar band
  home-footer.tsx          ← the ask field + record button under the feed
components/                ← the rest copied from production, almost unchanged
```

> `react-dom` is pinned to 19.1.0 even though the app never imports it.
> expo-router pulls it in transitively, and an unpinned copy resolves to 19.2.x
> and fails peer resolution against react 19.1.0. Production pins it for the
> same reason.

`lib/demo/content.ts` is **byte-identical to the same file in
`sideline-web-demo`**, so the same call opens on the phone and on the web with
the same rep, title and transcript. If you edit one, copy it to the other.

### Changing the sample data

Open `lib/demo/content.ts`. Everything is plain objects — people, calls,
dialogue, summaries. Times are relative (`daysAgo`, `hour`, `minute`) and
resolved at load, so the feed never goes stale.

The narrative covers a whole workspace, because the web demo needs one. This
app seeds itself from the slice belonging to `REP_PERSON_ID` — give that person
more calls in `CALLS` and they show up on the phone.

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
