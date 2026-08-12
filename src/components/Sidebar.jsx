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
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Users", icon: Users, to: "/admin/users" },
  { label: "Agents", icon: UserCog, to: "/admin/agents" },
  { label: "Documents", icon: FileText, to: "/admin/documents" },
  { label: "CBT Builder", icon: ClipboardList, to: "/admin/cbt-builder" },
  { label: "Reading Hub", icon: BookOpen, to: "/admin/reading-hub" },
  { label: "Payments & Subscription", icon: Wallet, to: "/admin/payments" },
  { label: "Announcements", icon: Megaphone, to: "/admin/announcements" },
];

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  function go(to) {
    navigate(to);
    onNavigate?.();
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
            to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);
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

      <button
        onClick={() => go("/admin/settings")}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
      >
        <Settings size={17} />
        Settings
      </button>
    </aside>
  );
}