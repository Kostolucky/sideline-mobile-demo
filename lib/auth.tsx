/**
 * The demo's stand-in for the session layer.
 *
 * Production's `lib/auth.tsx` holds a Supabase session, runs Google OAuth
 * through a deep link, and resolves workspace membership against the web API —
 * and the root layout refuses to render anything until both settle.
 *
 * None of that exists here. `useSession()` returns a signed-in person
 * immediately, and that person is always the rep whose workspace this app is
 * (see `lib/demo/store.ts`). There is no role and no membership to resolve,
 * because nothing on the phone branches on either: a rep sees their own calls,
 * which is the only thing this client can show.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useDemoState } from "@/lib/demo/use-demo";

/** The slice of a Supabase session the UI actually reads. */
export interface DemoSession {
  user: { id: string; email: string; name: string };
}

interface AuthState {
  session: DemoSession | null;
  isLoading: boolean;
  authError: string | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const state = useDemoState();

  const value = useMemo<AuthState>(
    () => ({
      session: {
        user: {
          id: state.user.userId,
          email: state.user.email,
          name: state.user.name,
        },
      },
      isLoading: false,
      authError: null,
      // Nothing to sign out of; the screen navigates to /sign-in instead.
      signOut: () => {},
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
