import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { friendlyAuthError } from "../lib/authErrors";
import GoogleIcon from "../components/GoogleIcon";
import AuthAmbientBackground from "../components/AuthAmbientBackground";

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-white/80";

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
  const [showPassword, setShowPassword] = useState(false);
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

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-[#0b1220]/85 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mb-6">
          <BrandLogo size={40} textClass="text-white" />
        </div>

        <h1 className="mb-1 text-xl font-semibold text-white">Welcome back</h1>
        <p className="mb-6 text-sm text-white/70">Sign in to continue learning.</p>

        {error && (
          <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email or Unique ID</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputClass}
              placeholder="you@example.com or UAR-26-8831"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-white/80">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-teal-300 hover:text-teal-200">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-teal-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-xs text-white/50">or</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-white/70">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-teal-300 hover:text-teal-200">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
