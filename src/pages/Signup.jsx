import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { friendlyAuthError } from "../lib/authErrors";
import GoogleIcon from "../components/GoogleIcon";
import AuthAmbientBackground from "../components/AuthAmbientBackground";

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp(email, password, name);
      navigate("/verify-email", { replace: true });
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
      navigate("/verify-email", { replace: true });
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

        <h1 className="mb-1 text-xl font-semibold text-text-primary">Create your account</h1>
        <p className="mb-6 text-sm text-text-secondary">Join students learning smarter.</p>

        {error && (
          <p className="mb-4 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Full name</label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-panel-alt/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-panel-alt/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Password</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-panel-alt/80 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-bg-app transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Sign up"}
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
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:text-accent-strong">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
