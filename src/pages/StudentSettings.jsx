import { Moon, Sun, Monitor, Bell, Shield, Palette, Check, Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function StudentSettings() {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const isPaid = profile?.plan === "annual" || profile?.plan === "paid";

  const themes = [
    { id: "light", label: "Light", desc: "Clean & bright for daytime study", icon: Sun },
    { id: "dark", label: "Dark", desc: "Easy on the eyes at night", icon: Moon },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Customize your experience.
          {!isPaid && " Theme switching is part of the Annual plan."}
        </p>
      </div>

      <section className="card-elevated p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Palette size={20} />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">Appearance</h2>
            <p className="text-sm text-text-secondary">Choose light or dark theme</p>
          </div>
          {!isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Crown size={12} /> Annual
            </span>
          )}
        </div>

        {!isPaid ? (
          <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-panel-alt p-5 text-center">
            <Lock size={22} className="mx-auto text-text-muted" />
            <p className="mt-2 text-sm font-medium text-text-primary">
              Theme options are on the Annual plan
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Upgrade to unlock light mode, dark mode, and more.
            </p>
            <Link to="/dashboard/subscription" className="btn-primary mt-4 inline-flex">
              View plans
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {themes.map(({ id, label, desc, icon: Icon }) => {
                const active = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      active
                        ? "border-accent bg-accent-soft shadow-md shadow-accent/10"
                        : "border-border-subtle bg-bg-panel-alt hover:border-border-strong"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        active ? "bg-accent text-bg-sidebar" : "bg-bg-elevated text-text-secondary"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary">{label}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">{desc}</p>
                    </div>
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg-sidebar">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <Monitor size={14} />
              Theme is saved on this device.
            </p>
          </>
        )}
      </section>

      <section className="card-elevated p-6 opacity-80">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-info/15 text-status-info">
            <Bell size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-text-primary">Notifications</h2>
            <p className="text-sm text-text-secondary">Coming soon</p>
          </div>
        </div>
      </section>

      <section className="card-elevated p-6 opacity-80">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-warning/15 text-status-warning">
            <Shield size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-text-primary">Privacy & Security</h2>
            <p className="text-sm text-text-secondary">Coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}
