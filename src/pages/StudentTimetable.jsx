import { useState } from "react";
import { Calendar, Lock, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isPro } from "../lib/subscription";
import SubscribeGateModal from "../components/SubscribeGateModal";

/**
 * Class timetable — Pro only. Free users see a locked surface + subscribe popup.
 */
export default function StudentTimetable() {
  const { profile } = useAuth();
  const pro = isPro(profile);
  const [gateOpen, setGateOpen] = useState(!pro);

  if (!pro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-ink">Timetable</h1>
          <p className="text-sm text-ink-muted">Your weekly class schedule.</p>
        </div>

        <button
          type="button"
          onClick={() => setGateOpen(true)}
          className="relative w-full overflow-hidden rounded-2xl border border-border-light bg-card-light text-left"
        >
          <div className="pointer-events-none select-none blur-[2px] opacity-40">
            <div className="grid grid-cols-6 gap-2 border-b border-border-light p-4 text-xs font-semibold text-ink-muted">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((r) => (
                <div key={r} className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div key={c} className="h-14 rounded-lg bg-surface-light" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
              <Lock size={26} />
            </span>
            <p className="text-base font-semibold text-ink">Timetable is locked</p>
            <p className="mt-1 max-w-xs text-center text-sm text-ink-muted">
              Subscribe to Pro to view and sync your class schedule.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-md">
              <Lock size={14} /> Unlock with Pro
            </span>
          </div>
        </button>

        <SubscribeGateModal
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          feature="Timetable"
        />
      </div>
    );
  }

  // Pro: placeholder schedule UI (ready for real data later)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Timetable</h1>
          <p className="text-sm text-ink-muted">Your weekly class schedule.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
          <Calendar size={13} /> Pro access
        </span>
      </div>

      <div className="rounded-2xl border border-border-light bg-card-light p-6 text-center">
        <Clock className="mx-auto text-teal" size={28} />
        <p className="mt-3 text-sm font-medium text-ink">Timetable is unlocked</p>
        <p className="mt-1 text-sm text-ink-muted">
          Your department schedule will appear here once published by admin.
        </p>
      </div>
    </div>
  );
}
