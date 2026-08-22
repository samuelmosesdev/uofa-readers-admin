import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BackButton({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname || "/";
  const isHome =
    path === "/admin" || path === "/admin/" ||
    path === "/agent" || path === "/agent/" ||
    path === "/dashboard" || path === "/dashboard/";
  if (isHome) return null;
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(path.startsWith("/admin") ? "/admin" : path.startsWith("/agent") ? "/agent" : "/dashboard"))}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle text-text-secondary hover:bg-bg-panel-alt ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
