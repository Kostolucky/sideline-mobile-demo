# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# This is a demo build

No backend, no auth, no environment variables, no secrets. All data is
hardcoded in `lib/demo/`. Do not add Supabase, API calls, or `.env` files.

Keep the native-module count at **zero** — the app runs in Expo Go, and adding a
native module (audio, sqlite, filesystem, secure-store) would force a custom dev
build and break `npx expo start --ios` as the entire workflow.

`lib/demo/content.ts` is kept byte-identical with the copy in
`sideline-web-demo`. Edit both.
