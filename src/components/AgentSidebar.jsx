import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/agent" },
  { label: "Documents", icon: FileText, to: "/agent/documents" },
  { label: "Courses", icon: BookOpen, to: "/agent/courses" },
  { label: "CBT Builder", icon: ClipboardList, to: "/agent/cbt-builder" },
];

export default function AgentSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  function go(to) {
    navigate(to);
    onNavigate?.();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar px-4 py-6">
      <div className="px-2 pb-8">
        <BrandLogo size={36} textClass="text-text-primary" />
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const isActive =
            to === "/agent" ? location.pathname === "/agent" : location.pathname.startsWith(to);
          return (
            <button
              key={label}
              type="button"
              onClick={() => go(to)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-bg-elevated text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              <span className="text-left leading-tight">{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => go("/agent/settings")}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
      >
        <Settings size={17} />
        Settings
      </button>
      <button
        type="button"
        onClick={() => signOut(auth)}
        className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-panel-alt hover:text-status-danger"
      >
        <LogOut size={17} />
        Log out
      </button>
    </aside>
  );
}