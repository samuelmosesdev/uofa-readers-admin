import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app text-sm text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Wait for the Firestore profile doc to load before making routing
  // decisions based on it (it arrives async right after `user` does).
  if (profile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app text-sm text-text-secondary">
        Loading…
      </div>
    );
  }

  const isRegularUser = profile.role === "user";
  const needsEmailVerification = isRegularUser && !profile.emailVerified;
  const needsProfileSetup = isRegularUser && profile.emailVerified && !profile.profileComplete;
  const onboardingDone = !isRegularUser || (profile.emailVerified && profile.profileComplete);

  // Onboarding steps run in order: verify email -> complete profile -> app.
  if (needsEmailVerification && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  if (needsProfileSetup && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  if (onboardingDone && (location.pathname === "/verify-email" || location.pathname === "/complete-profile")) {
    return <Navigate to={profile.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}