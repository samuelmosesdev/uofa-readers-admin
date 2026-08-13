import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  ClipboardList,
  BookOpen,
  Wallet,
  Megaphone,
  Settings,
  GraduationCap,
  LogOut,
  Bell,
  FileEdit,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/console" },
  { label: "Users", icon: Users, to: "/console/users" },
  { label: "Change requests", icon: FileEdit, to: "/console/change-requests" },
  { label: "Agents", icon: UserCog, to: "/console/agents" },
  { label: "Documents", icon: FileText, to: "/console/documents" },
  { label: "Courses", icon: BookOpen, to: "/console/courses" },
  { label: "CBT Builder", icon: ClipboardList, to: "/console/cbt-builder" },
  { label: "Payments & Subscription", icon: Wallet, to: "/console/payments" },
  { label: "Announcements", icon: Megaphone, to: "/console/announcements" },
  { label: "Notifications", icon: Bell, to: "/console/notifications" },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  function go(to) {
    navigate(to);
    onNavigate?.();
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Could not log out. Try again.");
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar px-4 py-6">
      <div className="flex items-center gap-2 px-2 pb-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <GraduationCap size={18} />
        </span>
        <span className="text-[15px] font-semibold text-text-primary">UofA Readers</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const isActive =
            to === "/console"
              ? location.pathname === "/console"
              : location.pathname.startsWith(to);
          return (
            <button
              key={label}
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

      <div className="space-y-1 border-t border-border-subtle pt-4">
        <button
          onClick={() => go("/console/settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            location.pathname.startsWith("/console/settings")
              ? "bg-bg-elevated text-text-primary font-medium"
              : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
          }`}
        >
          <Settings size={17} />
          Settings
        </button>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-panel-alt hover:text-status-danger"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </aside>
  );
}