import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function homeForRole(role) {
  if (role === "admin") return "/console";
  if (role === "agent") return "/agent";
  return "/dashboard";
}

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

  if (profile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app text-sm text-text-secondary">
        Loading…
      </div>
    );
  }

  const isRegularUser = profile.role === "user";
  const needsEmailVerification = isRegularUser && !profile.emailVerified;
  const needsProfileSetup =
    isRegularUser && profile.emailVerified && !profile.profileComplete;
  const onboardingDone =
    !isRegularUser || (profile.emailVerified && profile.profileComplete);

  if (needsEmailVerification && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  if (needsProfileSetup && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  if (
    onboardingDone &&
    (location.pathname === "/verify-email" ||
      location.pathname === "/complete-profile")
  ) {
    return <Navigate to={homeForRole(profile.role)} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={homeForRole(profile?.role)} replace />;
  }

  return children;
}