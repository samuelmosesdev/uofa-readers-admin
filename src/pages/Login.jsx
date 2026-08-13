import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { friendlyAuthError } from "../lib/authErrors";
import GoogleIcon from "../components/GoogleIcon";

export default function Login() {
  const { user, profile, loading: authLoading, signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in → send them to their app home (don't show login again)
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const role = profile?.role;
    if (role === "admin") navigate("/admin", { replace: true });
    else navigate(from.startsWith("/admin") ? "/dashboard" : from, { replace: true });
  }, [user, profile, authLoading, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmail(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-app px-4">
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-status-info/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card-elevated overflow-hidden p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong shadow-lg shadow-accent/25">
              <GraduationCap size={22} className="text-bg-sidebar" strokeWidth={2.2} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bg-app">
                <Sparkles size={9} className="text-accent" />
              </span>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-text-primary">UofA Reading HUB</p>
              <p className="text-xs font-medium text-accent">Learn · Practice · Excel</p>
            </div>
          </div>

          <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="mb-6 text-sm text-text-secondary">Sign in to continue your learning journey.</p>

          {error && (
            <div className="mb-5 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Email or Unique ID
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="you@example.com or UAR-26-8831"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? "Signing in…" : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs font-medium text-text-muted">or</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="btn-ghost w-full py-2.5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-accent transition-colors hover:text-accent-strong">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
