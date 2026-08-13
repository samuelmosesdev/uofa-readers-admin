import { CalendarClock, Sparkles } from "lucide-react";

export default function StudentTimetable() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent/20 to-status-info/15">
        <CalendarClock size={36} className="text-accent" />
        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg-sidebar shadow-lg shadow-accent/30">
          <Sparkles size={14} />
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">Timetable</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Your personal class timetable is on the way. You&apos;ll be able to add lectures,
        set reminders, and sync with your selected courses.
      </p>
      <span className="mt-6 inline-flex rounded-full border border-accent/30 bg-accent-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-accent">
        Coming soon
      </span>
    </div>
  );
}
