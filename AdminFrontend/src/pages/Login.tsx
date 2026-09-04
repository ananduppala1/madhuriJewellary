import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Button, Input } from "@/components/ui";

export function LoginPage() {
  const { admin, initialising, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (!initialising && admin) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (cause) {
      // The API never says which of the two was wrong, and neither do we.
      setError(
        cause instanceof ApiError ? cause.message : "Could not sign in. Please try again.",
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar"
          >
            <Lock className="h-5 w-5 text-accent" />
          </span>
          <h1 className="text-xl font-semibold">Madhuri Jewellers</h1>
          <p className="mt-1 text-sm text-ink-2">Sign in to manage the website</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5 text-[0.8125rem] text-danger"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Input
            id="email"
            label="Email address"
            type="email"
            autoComplete="username"
            autoFocus
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@madhurijewellers.in"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••••"
          />

          <Button type="submit" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-3">
          Your session is held in a secure cookie. If you have forgotten the password, it can be
          reset from the Supabase dashboard.
        </p>
      </div>
    </div>
  );
}
