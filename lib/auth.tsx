/**
 * The demo's stand-in for the session layer.
 *
 * Production's `lib/auth.tsx` holds a Supabase session, runs Google OAuth
 * through a deep link, and resolves workspace membership against the web API —
 * and the root layout refuses to render anything until both settle.
 *
 * None of that exists here. `useSession()` returns a signed-in person
 * immediately, and which person that is comes from the demo store's persona.
 * The interface is kept identical (`session`, `membership`, `isLoading`,
 * `signOut`) so `account-sheet.tsx` and the rest compile untouched.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useDemoState } from "@/lib/demo/use-demo";
import { setPersona } from "@/lib/demo/store";
import { ADMIN_PERSON_ID, REP_PERSON_ID } from "@/lib/demo/content";

export type MemberRole = "admin" | "member";

/** Fails closed, exactly as production does. */
export function toMemberRole(role: string): MemberRole {
  return role === "admin" ? "admin" : "member";
}

export interface Membership {
  organizationId: string;
  role: MemberRole;
  status: string;
}

/** The slice of a Supabase session the UI actually reads. */
export interface DemoSession {
  user: { id: string; email: string };
}

interface AuthState {
  session: DemoSession | null;
  membership: Membership | null;
  isLoading: boolean;
  authError: string | null;
  /** Demo-only: swap which person you are looking at the product as. */
  setPersonaId: (id: string) => void;
  personaIds: { admin: string; rep: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const state = useDemoState();

  const value = useMemo<AuthState>(() => {
    const member = state.members.find((m) => m.userId === state.personaId);
    return {
      session: member
        ? { user: { id: member.userId, email: member.email } }
        : null,
      membership: member
        ? {
            organizationId: state.organizationId,
            role: member.role,
            status: "active",
          }
        : null,
      isLoading: false,
      authError: null,
      setPersonaId: setPersona,
      personaIds: { admin: ADMIN_PERSON_ID, rep: REP_PERSON_ID },
      // Nothing to sign out of; the screen navigates to /sign-in instead.
      signOut: () => {},
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
