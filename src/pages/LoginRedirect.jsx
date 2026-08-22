import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathFor } from "../lib/roles";
import { LoadingState } from "../components/ui";

/** After login: wait for profile, then route by role / password flag */
export default function LoginRedirect() {
  const { user, profile, profileReady, loading } = useAuth();

  if (loading || (user && !profileReady)) {
    return <LoadingState message="Signing you in…" />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  return <Navigate to={homePathFor(profile)} replace />;
}
