import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  CreditCard,
  ToggleLeft,
  Bell,
  Palette,
  AlertTriangle,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import { usePlatformSettings, DEFAULT_SETTINGS } from "../hooks/usePlatformSettings";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "auth", label: "Auth & Security", icon: Shield },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "features", label: "Features", icon: ToggleLeft },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? "bg-accent" : "bg-bg-elevated"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-primary">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {children}
    </select>
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

function Card({ title, description, children }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-panel p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { settings, loading, saving, saveSettings } = usePlatformSettings();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function update(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function handleSave() {
    const res = await saveSettings(form);
    if (res.ok) {
      setToast({ type: "success", msg: "Settings saved successfully" });
    } else {
      setToast({ type: "error", msg: res.error || "Failed to save" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  function handleResetSection() {
    if (!window.confirm("Reset this section to defaults?")) return;
    // Simple full reset for now — can be made section-aware later
    setForm(DEFAULT_SETTINGS);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted">
            Platform-wide configuration. Changes apply immediately to all admins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSection}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-panel px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0a0f1e] hover:bg-accent-strong disabled:opacity-60"
          >
            {saving ? (
              "Saving…"
            ) : (
              <>
                <Save size={15} />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-accent-soft text-accent"
              : "bg-status-danger/15 text-status-danger"
          }`}
        >
          {toast.type === "success" && <Check size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tabs */}
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                tab === id
                  ? "bg-bg-elevated text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-panel-alt hover:text-text-primary"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* ── GENERAL ── */}
          {tab === "general" && (
            <>
              <Card title="Platform identity" description="Basic branding shown across the product.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="App name">
                    <Input
                      value={form.appName}
                      onChange={(e) => update("appName", e.target.value)}
                    />
                  </Field>
                  <Field label="Support email">
                    <Input
                      type="email"
                      value={form.supportEmail}
                      onChange={(e) => update("supportEmail", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Tagline">
                  <Input
                    value={form.tagline}
                    onChange={(e) => update("tagline", e.target.value)}
                  />
                </Field>
                <Field label="Timezone">
                  <Select
                    value={form.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                  >
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </Select>
                </Field>
              </Card>

              <Card title="Maintenance mode" description="Temporarily take the platform offline for students.">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Enable maintenance mode</p>
                    <p className="text-xs text-text-muted">Students will see the message below</p>
                  </div>
                  <Toggle
                    checked={form.maintenanceMode}
                    onChange={(v) => update("maintenanceMode", v)}
                  />
                </div>
                {form.maintenanceMode && (
                  <Field label="Maintenance message">
                    <Textarea
                      value={form.maintenanceMessage}
                      onChange={(e) => update("maintenanceMessage", e.target.value)}
                    />
                  </Field>
                )}
              </Card>
            </>
          )}

          {/* ── AUTH ── */}
          {tab === "auth" && (
            <>
              <Card title="Sign-in methods">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">Email / Password</span>
                    <Toggle
                      checked={form.allowEmailPassword}
                      onChange={(v) => update("allowEmailPassword", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">Google</span>
                    <Toggle
                      checked={form.allowGoogle}
                      onChange={(v) => update("allowGoogle", v)}
                    />
                  </div>
                </div>
              </Card>

              <Card title="Security policies">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-primary">Force email verification</p>
                      <p className="text-xs text-text-muted">Users must verify before accessing dashboard</p>
                    </div>
                    <Toggle
                      checked={form.forceEmailVerification}
                      onChange={(v) => update("forceEmailVerification", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-primary">Require profile completion</p>
                      <p className="text-xs text-text-muted">Faculty, department, level must be filled</p>
                    </div>
                    <Toggle
                      checked={form.requireProfileCompletion}
                      onChange={(v) => update("requireProfileCompletion", v)}
                    />
                  </div>
                  <Field label="Minimum password length">
                    <Input
                      type="number"
                      min={6}
                      max={32}
                      value={form.minPasswordLength}
                      onChange={(e) => update("minPasswordLength", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </Card>

              <Card title="User defaults">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Default role on signup">
                    <Select
                      value={form.defaultRole}
                      onChange={(e) => update("defaultRole", e.target.value)}
                    >
                      <option value="user">Student (user)</option>
                      <option value="agent">Agent</option>
                    </Select>
                  </Field>
                  <Field label="Unique ID prefix" hint="e.g. UAR → UAR-26-4821">
                    <Input
                      value={form.uniqueIdPrefix}
                      onChange={(e) => update("uniqueIdPrefix", e.target.value.toUpperCase())}
                    />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {/* ── SUBSCRIPTIONS ── */}
          {tab === "subscriptions" && (
            <>
              <Card title="Trial & grace">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Free trial days">
                    <Input
                      type="number"
                      min={0}
                      value={form.freeTrialDays}
                      onChange={(e) => update("freeTrialDays", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Grace period after failed payment (days)">
                    <Input
                      type="number"
                      min={0}
                      value={form.gracePeriodDays}
                      onChange={(e) => update("gracePeriodDays", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </Card>

              <Card title="Plans" description="Edit names and prices. Connect real payment IDs later.">
                <div className="space-y-4">
                  {form.plans?.map((plan, idx) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-border-subtle bg-bg-panel-alt p-4 space-y-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Name">
                          <Input
                            value={plan.name}
                            onChange={(e) => {
                              const plans = [...form.plans];
                              plans[idx] = { ...plan, name: e.target.value };
                              update("plans", plans);
                            }}
                          />
                        </Field>
                        <Field label="Price (₦)">
                          <Input
                            type="number"
                            value={plan.price}
                            onChange={(e) => {
                              const plans = [...form.plans];
                              plans[idx] = { ...plan, price: Number(e.target.value) };
                              update("plans", plans);
                            }}
                          />
                        </Field>
                        <Field label="Interval">
                          <Select
                            value={plan.interval}
                            onChange={(e) => {
                              const plans = [...form.plans];
                              plans[idx] = { ...plan, interval: e.target.value };
                              update("plans", plans);
                            }}
                          >
                            <option value="forever">Forever</option>
                            <option value="month">Monthly</option>
                            <option value="year">Yearly</option>
                          </Select>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── FEATURES ── */}
          {tab === "features" && (
            <>
              <Card title="Modules" description="Turn entire product areas on or off.">
                <div className="space-y-4">
                  {Object.entries(form.modules || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-text-primary">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <Toggle
                        checked={value}
                        onChange={(v) => update(`modules.${key}`, v)}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Uploads">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Max file size (MB)">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={form.maxUploadMb}
                      onChange={(e) => update("maxUploadMb", Number(e.target.value))}
                    />
                  </Field>
                </div>
                <Field
                  label="Allowed MIME types"
                  hint="Comma-separated. Leave empty to allow all."
                >
                  <Textarea
                    value={(form.allowedMimeTypes || []).join(", ")}
                    onChange={(e) =>
                      update(
                        "allowedMimeTypes",
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </Field>
              </Card>
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <Card title="Email & in-app notifications">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">Admin email alerts</p>
                    <p className="text-xs text-text-muted">New signups, payments, reports</p>
                  </div>
                  <Toggle
                    checked={form.adminEmailNotifications}
                    onChange={(v) => update("adminEmailNotifications", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">Student welcome email</p>
                  </div>
                  <Toggle
                    checked={form.studentWelcomeEmail}
                    onChange={(v) => update("studentWelcomeEmail", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-primary">Payment failed email</p>
                  </div>
                  <Toggle
                    checked={form.paymentFailedEmail}
                    onChange={(v) => update("paymentFailedEmail", v)}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ── APPEARANCE ── */}
          {tab === "appearance" && (
            <Card title="Admin UI preferences">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Accent color" hint="Default is the mint teal">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => update("accentColor", e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-border-subtle bg-transparent"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={(e) => update("accentColor", e.target.value)}
                    />
                  </div>
                </Field>
                <Field label="Density">
                  <Select
                    value={form.density}
                    onChange={(e) => update("density", e.target.value)}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </Select>
                </Field>
              </div>
            </Card>
          )}

          {/* ── DANGER ── */}
          {tab === "danger" && (
            <Card
              title="Danger zone"
              description="These actions are irreversible. Proceed with extreme caution."
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-status-danger/30 bg-status-danger/5 p-4">
                  <p className="text-sm font-medium text-status-danger">Reset all settings to defaults</p>
                  <p className="mt-1 text-xs text-text-muted">
                    This overwrites every setting on this page.
                  </p>
                  <button
                    onClick={() => {
                      if (window.confirm("Really reset ALL settings to factory defaults?")) {
                        setForm(DEFAULT_SETTINGS);
                        saveSettings(DEFAULT_SETTINGS);
                      }
                    }}
                    className="mt-3 rounded-lg border border-status-danger/50 px-3 py-1.5 text-sm text-status-danger hover:bg-status-danger/10"
                  >
                    Reset everything
                  </button>
                </div>

                <div className="rounded-lg border border-status-danger/30 bg-status-danger/5 p-4">
                  <p className="text-sm font-medium text-status-danger">Clear activity logs</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Permanently delete activityLog documents older than 90 days (implement later).
                  </p>
                  <button
                    disabled
                    className="mt-3 cursor-not-allowed rounded-lg border border-border-subtle px-3 py-1.5 text-sm text-text-muted opacity-60"
                  >
                    Coming soon
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}