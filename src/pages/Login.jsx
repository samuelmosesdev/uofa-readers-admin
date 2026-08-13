import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { friendlyAuthError } from "../lib/authErrors";
import GoogleIcon from "../components/GoogleIcon";
import AuthAmbientBackground from "../components/AuthAmbientBackground";

function homeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "agent") return "/agent";
  return "/dashboard";
}

export default function Login() {
  const { user, profile, signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  useEffect(() => {
    if (pendingRedirect && user && profile) {
      const from = location.state?.from?.pathname;
      let dest = homeForRole(profile.role);
      if (from) {
        if (profile.role === "admin" && from.startsWith("/admin")) dest = from;
        else if (profile.role === "agent" && from.startsWith("/agent")) dest = from;
        else if (profile.role === "user" && from.startsWith("/dashboard")) dest = from;
      }
      setPendingRedirect(false);
      navigate(dest, { replace: true });
    }
  }, [pendingRedirect, user, profile, navigate, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmail(identifier, password);
      setPendingRedirect(true);
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
      setPendingRedirect(true);
    } catch (err) {
      setError(friendlyAuthError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AuthAmbientBackground />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#111a2e]/75 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GraduationCap size={18} />
          </span>
          <span className="text-[15px] font-semibold text-text-primary">UofA Readers</span>
        </div>

        <h1 className="mb-1 text-xl font-semibold text-text-primary">Welcome back</h1>
        <p className="mb-6 text-sm text-text-secondary">Sign in to continue learning.</p>

        {error && (
          <p className="mb-4 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Email or Unique ID
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-panel-alt/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="you@example.com or UAR-26-8831"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-panel-alt/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-bg-app transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-bg-panel-alt/60 px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-accent hover:text-accent-strong">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
