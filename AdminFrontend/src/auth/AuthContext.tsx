import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    const controller = new AbortController();

    auth
      .me({ signal: controller.signal })
      .then((result) => setAdmin(result.admin))
      .catch(() => setAdmin(null))
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
    setAdmin(result.admin);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } catch (error) {
      // A logout that fails server-side must still clear the client state.
      if (!(error instanceof ApiError)) throw error;
    } finally {
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
