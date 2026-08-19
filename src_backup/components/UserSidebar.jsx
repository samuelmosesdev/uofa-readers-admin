import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Library,
  Bell,
  UserCircle,
  Settings,
  LogOut,
  Crown,
  Calendar,
  Lock,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { isPro } from "../lib/subscription";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Courses", icon: BookOpen, to: "/dashboard/courses" },
  { label: "Practice/CBT", icon: ClipboardCheck, to: "/dashboard/practice" },
  { label: "Reading Hub", icon: Library, to: "/dashboard/reading-hub" },
  { label: "Timetable", icon: Calendar, to: "/dashboard/timetable", proOnly: true },
  { label: "Notifications", icon: Bell, to: "/dashboard/notifications" },
  { label: "Go Pro", icon: Crown, to: "/dashboard/upgrade" },
  { label: "Profile", icon: UserCircle, to: "/dashboard/profile" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export default function UserSidebar({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const pro = isPro(profile);

  function go(to) {
    navigate(to);
    onNavigate?.();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between bg-bg-sidebar px-4 py-6">
      <div>
        <div className="px-2 pb-8">
          <BrandLogo size={40} stacked textClass="text-text-primary" />
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, to, proOnly }) => {
            const isActive =
              to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(to);
            const locked = proOnly && !pro;
            return (
              <button
                key={label}
                onClick={() => go(to)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-bg-sidebar font-semibold"
                    : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                <span className="flex-1 text-left">{label}</span>
                {locked && <Lock size={13} className="opacity-70" />}
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