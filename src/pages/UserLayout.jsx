import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import UserTopbar from "../components/UserTopbar";
import { useUserDashboardData } from "../hooks/useUserDashboardData";

export default function UserLayout() {
  const { profile, unreadCount } = useUserDashboardData();
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-light">
      <div className="hidden lg:flex">
        <UserSidebar onNavigate={() => setMobileNavOpen(false)} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <UserSidebar onNavigate={() => setMobileNavOpen(false)} />
          <div className="flex-1 bg-black/50" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 bg-card-light px-4 pt-4 lg:hidden">
          <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="text-ink-muted">
            <Menu size={20} />
          </button>
        </div>
        <UserTopbar profile={profile} unreadCount={unreadCount} search={search} onSearchChange={setSearch} />

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}