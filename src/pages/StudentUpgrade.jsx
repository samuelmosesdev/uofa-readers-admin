import { Check, Crown, Sparkles, X, ExternalLink, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePaymentSettings } from "../hooks/usePaymentSettings";
import {
  FREE_FEATURES,
  FREE_LIMITS,
  PRO_FEATURES,
  isPro,
  planLabel,
} from "../lib/subscription";

export default function StudentUpgrade() {
  const { profile } = useAuth();
  const { settings, loading } = usePaymentSettings();
  const pro = isPro(profile);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-teal/20 bg-gradient-to-br from-[#0b3d36] via-[#0f7a6c] to-[#14b8a6] p-6 text-white shadow-lg sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles size={13} />
            {pro ? "You're on Pro" : "Free plan limits apply"}
          </div>
          <h1 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
            {pro ? "Full access unlocked" : settings.headline || "Study without limits"}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/85 sm:text-base">
            {pro
              ? "Thanks for supporting UofA Readers. Every course, document, and timed quiz is open for you."
              : settings.subheadline ||
                "Pro removes caps on courses, practice questions, and materials — built for serious exam prep."}
          </p>
          {!pro && (
            <p className="mt-4 text-2xl font-bold sm:text-3xl">
              {loading ? "…" : settings.priceLabel}
            </p>
          )}
          {!pro && settings.priceNote && (
            <p className="mt-1 text-xs text-white/70">{settings.priceNote}</p>
          )}
        </div>
      </section>

      {pro ? (
        <div className="flex items-start gap-3 rounded-2xl border border-teal/30 bg-teal-soft p-5">
          <Crown className="mt-0.5 shrink-0 text-teal" size={22} />
          <div>
            <p className="font-semibold text-ink">Pro active · {planLabel(profile)}</p>
            <p className="mt-1 text-sm text-ink-muted">
              You can enrol in any course, take full CBT sets, run timed quizzes, and open every
              document.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border-light bg-card-light p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Free</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Starter</h2>
              <ul className="mt-4 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-ink-muted">
                    <X size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink-muted">
                Cap: {FREE_LIMITS.maxCourses} courses · {FREE_LIMITS.practiceQuestions} Qs ·{" "}
                {FREE_LIMITS.documentsPerCourse} file / course
              </p>
            </div>

            <div className="relative rounded-2xl border-2 border-teal bg-card-light p-5 shadow-[0_12px_40px_rgba(15,122,108,0.15)]">
              <div className="absolute -top-3 right-4 rounded-full bg-teal px-3 py-0.5 text-[11px] font-bold text-white">
                RECOMMENDED
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">Pro</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Unlimited prep</h2>
              <ul className="mt-4 space-y-2.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-ink">
                    <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-card-light p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">Pay securely, then we activate Pro</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Complete payment on Selar or Remita. Keep your receipt — an admin will mark your
              account Pro (usually same day).
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {settings.selarUrl ? (
                <a
                  href={settings.selarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-dark"
                >
                  Pay with Selar <ExternalLink size={15} />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-xl bg-teal/40 px-5 py-3.5 text-sm font-semibold text-white"
                >
                  Selar link not set yet
                </button>
              )}
              {settings.remitaUrl ? (
                <a
                  href={settings.remitaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-teal px-5 py-3.5 text-sm font-semibold text-teal transition hover:bg-teal-soft"
                >
                  Pay with Remita <ExternalLink size={15} />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-xl border border-border-light px-5 py-3.5 text-sm font-medium text-ink-muted"
                >
                  Remita link not set yet
                </button>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
              <Shield size={14} className="mt-0.5 shrink-0 text-teal" />
              Payment is processed by Selar / Remita — UofA Readers never stores your card details.
            </div>
          </div>
        </>
      )}
    </div>
  );
}