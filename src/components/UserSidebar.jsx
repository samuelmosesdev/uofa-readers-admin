import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Library,
  Bell,
  UserCircle,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Courses", icon: BookOpen, to: "/dashboard/courses" },
  { label: "Practice/CBT", icon: ClipboardCheck, to: "/dashboard/practice" },
  { label: "Reading Hub", icon: Library, to: "/dashboard/reading-hub" },
  { label: "Notifications", icon: Bell, to: "/dashboard/notifications" },
  { label: "Profile", icon: UserCircle, to: "/dashboard/profile" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export default function UserSidebar({ activePath = "/dashboard", onNavigate }) {
  return (
    <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col justify-between bg-bg-sidebar px-4 py-6">
      <div>
        <div className="flex items-center gap-2 px-2 pb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GraduationCap size={18} />
          </span>
          <span className="text-[15px] font-semibold leading-tight text-text-primary">
            UofA
            <br />
            Readers
          </span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const isActive = activePath === to;
            return (
              <button
                key={label}
                onClick={() => onNavigate?.(to)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-bg-sidebar font-semibold"
                    : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        onClick={() => signOut(auth)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-panel-alt hover:text-status-danger"
      >
        <LogOut size={17} />
        Log out
      </button>
    </aside>
  );
}
