import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Library,
  CalendarClock,
  Bell,
  UserCircle,
  Settings,
  Crown,
  LogOut,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Courses", icon: BookOpen, to: "/dashboard/courses" },
  { label: "Practice / CBT", icon: ClipboardCheck, to: "/dashboard/practice" },
  { label: "Reading Hub", icon: Library, to: "/dashboard/reading-hub" },
  { label: "Timetable", icon: CalendarClock, to: "/dashboard/timetable" },
  { label: "Subscription", icon: Crown, to: "/dashboard/subscription" },
  { label: "Notifications", icon: Bell, to: "/dashboard/notifications" },
  { label: "Profile", icon: UserCircle, to: "/dashboard/profile" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export default function UserSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  function go(to) {
    navigate(to);
    onNavigate?.();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border-subtle bg-bg-sidebar px-3 py-5 animate-slide-in">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong shadow-lg shadow-accent/20">
            <GraduationCap size={20} className="text-bg-sidebar" strokeWidth={2.2} />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg-app">
              <Sparkles size={8} className="text-accent" />
            </span>
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-text-primary leading-none">
              UofA Reading
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-accent">HUB</p>
          </div>
        </div>

        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const isActive =
              to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(to);
            return (
              <button
                key={label}
                onClick={() => go(to)}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <Icon size={16} strokeWidth={2} />
                </span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        onClick={() => signOut(auth)}
        className="nav-item mt-4 text-status-danger hover:!bg-status-danger/10 hover:!text-status-danger"
      >
        <span className="nav-icon">
          <LogOut size={16} strokeWidth={2} />
        </span>
        Log out
      </button>
    </aside>
  );
}
