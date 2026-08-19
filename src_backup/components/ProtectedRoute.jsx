import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function homeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "agent") return "/agent";
  return "/dashboard";
}

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, profileReady, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && !profileReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app text-sm text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Signed in but no Firestore profile — send regular users to complete onboarding,
  // agents/admins see a clear message path via login home.
  if (!profile) {
    return <Navigate to="/complete-profile" replace />;
  }

  const role = profile.role || "user";
  const isRegularUser = role === "user";
  const needsEmailVerification = isRegularUser && !profile.emailVerified;
  const needsProfileSetup = isRegularUser && profile.emailVerified && !profile.profileComplete;
  const onboardingDone = !isRegularUser || (profile.emailVerified && profile.profileComplete);

  if (needsEmailVerification && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  if (needsProfileSetup && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  if (onboardingDone && (location.pathname === "/verify-email" || location.pathname === "/complete-profile")) {
    // Agents/admins who land on complete-profile after missing doc get sent home
    if (!isRegularUser) return <Navigate to={homeForRole(role)} replace />;
    return <Navigate to={homeForRole(role)} replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role)) {
      return <Navigate to={homeForRole(role)} replace />;
    }
  }

  return children;
}
