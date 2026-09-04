import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ApiError, setSessionLostHandler } from "@/api/client";
import { auth } from "@/api/endpoints";
import type { Admin } from "@/types";

/**
 * The backend is authoritative about who is signed in. This context does not
 * decide that — it asks `/auth/me` on load and after a login, and holds the
 * answer. There is no token here to store, because the session lives in
 * HTTP-only cookies the browser manages and this code cannot read.
 */

type AuthState = {
  admin: Admin | null;
  /** True until the initial session check resolves. */
  initialising: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [initialising, setInitialising] = useState(true);

  /**
   * Bumped by every deliberate authentication change. The session check started
   * at mount may only write state while this is unchanged, so a slow `/auth/me`
   * that was sent before a sign-in — and is therefore answered 401 — cannot land
   * afterwards and erase the session it predates.
   */
  const authGeneration = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = authGeneration.current;
    const stillCurrent = () => authGeneration.current === startedAt;

    auth
      .me({ signal: controller.signal })
      .then((result) => {
        if (stillCurrent()) setAdmin(result.admin);
      })
      .catch(() => {
        if (stillCurrent()) setAdmin(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialising(false);
      });

    return () => controller.abort();
  }, []);

  // When the API client exhausts its refresh attempt, drop the local session so
  // the router sends the user back to the sign-in screen.
  useEffect(() => {
    setSessionLostHandler(() => setAdmin(null));
    return () => setSessionLostHandler(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await auth.login(email, password);
    // Supersede the mount-time check before publishing the new session, and stop
    // "checking" — the backend has just told us exactly who this is.
    authGeneration.current += 1;
    setAdmin(result.admin);
    setInitialising(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } catch (error) {
      // A logout that fails server-side must still clear the client state.
      if (!(error instanceof ApiError)) throw error;
    } finally {
      // Same guard in the other direction: a late session check must not be able
      // to resurrect an account that has just signed out.
      authGeneration.current += 1;
      setAdmin(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, initialising, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/**
 * A convenience, not a security control. Every protected endpoint is enforced
 * server-side; this only avoids showing an empty dashboard to someone who is
 * not signed in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { admin, initialising } = useAuth();
  const location = useLocation();

  if (initialising) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span role="status" aria-live="polite" className="text-sm text-ink-3">
          Checking your session…
        </span>
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
