import { useEffect, useState } from "react";
import { Wallet, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useSubscriptionPlans, DEFAULT_PLANS } from "../hooks/useSubscriptionPlans";

function FeatureEditor({ features, onChange }) {
  function update(i, val) {
    const next = [...features];
    next[i] = val;
    onChange(next);
  }
  function remove(i) {
    onChange(features.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...features, ""]);
  }
  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={f}
            onChange={(e) => update(i, e.target.value)}
            className="input-field flex-1"
            placeholder="Feature line…"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-xl border border-border-subtle p-2 text-text-muted hover:text-status-danger"
            aria-label="Remove feature"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="btn-ghost text-xs"
      >
        <Plus size={14} /> Add feature
      </button>
    </div>
  );
}

export default function AdminPayments() {
  const { plans, loading, saving, error, savePlans, setError } = useSubscriptionPlans();
  const [form, setForm] = useState(DEFAULT_PLANS);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (!loading) setForm(plans);
  }, [loading, plans]);

  function patch(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      if (path.startsWith("free.")) {
        next.free = { ...next.free, [path.slice(5)]: value };
      } else if (path.startsWith("annual.")) {
        next.annual = { ...next.annual, [path.slice(7)]: value };
      } else if (path.startsWith("monthly.")) {
        next.monthly = { ...next.monthly, [path.slice(8)]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
    setSavedOk(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    const ok = await savePlans(form);
    if (ok) {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-text-secondary">Loading plan settings…</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Wallet size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Payments & Subscription
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Set fees and feature lists. Students see these prices live on the Subscription page.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Currency + support */}
        <section className="card-elevated space-y-4 p-5">
          <h2 className="text-sm font-semibold text-text-primary">General</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Currency code</label>
              <input
                value={form.currency}
                onChange={(e) => patch("currency", e.target.value)}
                className="input-field"
                placeholder="NGN"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Symbol</label>
              <input
                value={form.currencySymbol}
                onChange={(e) => patch("currencySymbol", e.target.value)}
                className="input-field"
                placeholder="₦"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-text-secondary">WhatsApp support URL</label>
              <input
                value={form.whatsappSupport}
                onChange={(e) => patch("whatsappSupport", e.target.value)}
                className="input-field"
                placeholder="https://wa.me/234…"
              />
            </div>
          </div>
        </section>

        {/* Free plan */}
        <section className="card-elevated space-y-4 p-5">
          <h2 className="text-sm font-semibold text-text-primary">Free plan</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Name</label>
              <input
                value={form.free.name}
                onChange={(e) => patch("free.name", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Price</label>
              <input
                type="number"
                min={0}
                value={form.free.price}
                onChange={(e) => patch("free.price", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Features</label>
            <FeatureEditor
              features={form.free.features || []}
              onChange={(f) => patch("free.features", f)}
            />
          </div>
        </section>

        {/* Annual plan */}
        <section className="card-elevated space-y-4 border-accent/30 p-5">
          <h2 className="text-sm font-semibold text-accent">Annual (paid) plan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Name</label>
              <input
                value={form.annual.name}
                onChange={(e) => patch("annual.name", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Price ({form.currencySymbol}/year)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.annual.price}
                onChange={(e) => patch("annual.price", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Badge text</label>
              <input
                value={form.annual.badge || ""}
                onChange={(e) => patch("annual.badge", e.target.value)}
                className="input-field"
                placeholder="Popular"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Features</label>
            <FeatureEditor
              features={form.annual.features || []}
              onChange={(f) => patch("annual.features", f)}
            />
          </div>
        </section>

        {/* Monthly optional */}
        <section className="card-elevated space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-text-primary">Monthly plan (optional)</h2>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={Boolean(form.monthly?.enabled)}
                onChange={(e) => patch("monthly.enabled", e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-[var(--color-accent)]"
              />
              Show on student page
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Name</label>
              <input
                value={form.monthly?.name || ""}
                onChange={(e) => patch("monthly.name", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Price ({form.currencySymbol}/month)
              </label>
              <input
                type="number"
                min={0}
                value={form.monthly?.price ?? 0}
                onChange={(e) => patch("monthly.price", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Features</label>
            <FeatureEditor
              features={form.monthly?.features || []}
              onChange={(f) => patch("monthly.features", f)}
            />
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {error}
          </p>
        )}
        {savedOk && (
          <p className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
            <CheckCircle2 size={16} /> Saved. Students will see the new fees immediately.
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          <Save size={16} />
          {saving ? "Saving…" : "Save plan fees"}
        </button>
      </form>

      <p className="text-xs text-text-muted">
        Stored in Firestore at <code className="text-accent">settings/subscription</code>.
        Payment gateway (Paystack / Flutterwave) can be wired later using these amounts.
      </p>
    </div>
  );
}
