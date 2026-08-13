import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Brain,
  Library,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Zap,
  Users,
  MessageCircle,
} from "lucide-react";

/* High-quality ambient study imagery (Unsplash) */
const HERO_IMG =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80";
const CARD_1 =
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80";
const CARD_2 =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";
const CARD_3 =
  "https://images.unsplash.com/photo-1456513080681-7c450e1238ea?auto=format&fit=crop&w=800&q=80";

const FEATURES = [
  {
    icon: Library,
    title: "Reading Hub",
    desc: "Course PDFs and materials organised by faculty and level — always within reach.",
  },
  {
    icon: Brain,
    title: "AI Practice & CBT",
    desc: "Turn notes into timed quizzes. Practice smarter, not longer.",
  },
  {
    icon: Zap,
    title: "Streaks & Progress",
    desc: "Stay consistent with gentle streaks and clear progress on every course.",
  },
  {
    icon: Users,
    title: "Built for UofA",
    desc: "Designed around University of Abuja courses, levels, and real student workflows.",
  },
];

export default function Landing() {
  const { user, profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const appHome = profile?.role === "admin" ? "/admin" : "/dashboard";

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060a14] text-white">
      {/* ——— Nav ——— */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[#060a14]/85 backdrop-blur-xl shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <GraduationCap size={18} className="text-[#060a14]" strokeWidth={2.4} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              UofA <span className="text-emerald-400">Reading HUB</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-sm font-semibold text-[#060a14] shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
            >
              Join free
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ——— Hero ——— */}
      <section className="relative flex min-h-screen items-center pt-16">
        {/* Ambient background image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Students studying together"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/70 via-[#060a14]/75 to-[#060a14]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a14]/90 via-[#060a14]/50 to-transparent" />
        </div>

        {/* Floating orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[20%] h-64 w-64 animate-float rounded-full bg-emerald-500/15 blur-3xl" />
          <div
            className="absolute bottom-[15%] right-[10%] h-80 w-80 rounded-full bg-teal-400/10 blur-3xl"
            style={{ animation: "float 5s ease-in-out infinite reverse" }}
          />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Copy */}
          <div
            className={`transition-all duration-700 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles size={13} />
              Built for University of Abuja students
            </div>

            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Study smarter.
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Pass with confidence.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              UofA Reading HUB brings your course materials, AI-powered practice questions,
              and CBT drills into one calm space — so you can focus on learning, not hunting for PDFs.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link
                  to={appHome}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3.5 text-sm font-bold text-[#060a14] shadow-xl shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98]"
                >
                  Go to dashboard
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3.5 text-sm font-bold text-[#060a14] shadow-xl shadow-emerald-500/30 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Join free
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Faculty-aligned materials
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Mobile-friendly
              </span>
            </div>
          </div>

          {/* Floating phone / study cards */}
          <div
            className={`relative mx-auto hidden max-w-md transition-all delay-150 duration-700 lg:block ${
              visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
          >
            <div className="relative">
              {/* Main study card */}
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-md">
                <img
                  src={CARD_1}
                  alt="Student focused on studies"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-semibold text-white">Anatomy · Chapter 4</p>
                  <p className="mt-0.5 text-xs text-white/50">Continue where you left off</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                  </div>
                </div>
              </div>

              {/* Floating secondary cards */}
              <div
                className="absolute -left-8 top-8 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222]/90 shadow-xl backdrop-blur-md animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <img src={CARD_2} alt="Student with phone" className="aspect-square w-full object-cover" />
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-white">Practice CBT</p>
                  <p className="text-[10px] text-emerald-400">24 questions ready</p>
                </div>
              </div>

              <div
                className="absolute -bottom-4 -right-6 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222]/90 shadow-xl backdrop-blur-md animate-float"
                style={{ animationDelay: "1s", animationDirection: "reverse" }}
              >
                <img src={CARD_3} alt="Notes and phone" className="h-20 w-full object-cover" />
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-white">6-day streak 🔥</p>
                  <p className="text-[10px] text-white/50">Keep it going today</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
          <span className="text-[11px] font-medium uppercase tracking-widest text-white/30">
            Scroll
          </span>
          <div className="h-8 w-px animate-pulse bg-gradient-to-b from-emerald-400/60 to-transparent" />
        </div>
      </section>

      {/* ——— Features ——— */}
      <section className="relative border-t border-white/5 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.06),_transparent_60%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Why Reading HUB
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to{" "}
              <span className="text-emerald-300">own your semester</span>
            </h2>
            <p className="mt-4 text-white/55">
              From PDFs to practice questions — one place, built for how UofA students actually study.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition duration-300 hover:border-emerald-400/25 hover:bg-white/[0.06]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10 text-emerald-400 transition group-hover:from-emerald-400 group-hover:to-teal-500 group-hover:text-[#060a14]">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Ambient split: phone study ——— */}
      <section className="relative overflow-hidden border-t border-white/5 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-emerald-900/20">
              <img
                src={CARD_2}
                alt="Student studying with phone"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]"
              />
            </div>
            {/* Glow */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-emerald-500/10 blur-2xl" />
          </div>

          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              <Smartphone size={13} className="text-emerald-400" />
              Study anywhere
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your campus library,
              <br />
              <span className="text-emerald-300">in your pocket.</span>
            </h2>
            <p className="mt-4 text-white/55 leading-relaxed">
              Open materials between lectures. Run a quick CBT on the bus.
              Pick up exactly where you stopped — Reading HUB stays with you.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Offline-friendly reading experience",
                "AI questions generated from your PDFs",
                "Progress that follows you across devices",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#060a14] transition hover:bg-emerald-50"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ——— Final CTA ——— */}
      <section className="relative border-t border-white/5 py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.1),_transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <BookOpen className="mx-auto text-emerald-400" size={36} />
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mt-3 text-white/55">
            Join students who are already reading, practicing, and staying consistent on Reading HUB.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-7 py-3.5 text-sm font-bold text-[#060a14] shadow-xl shadow-emerald-500/30 transition hover:brightness-110"
            >
              Create free account
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="border-t border-white/8 bg-[#04070f]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <GraduationCap size={15} className="text-[#060a14]" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">UofA Reading HUB</p>
              <p className="text-[11px] text-white/40">Learn · Practice · Excel</p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-sm text-white/50">
              Created by{" "}
              <span className="font-semibold text-emerald-400">emvisuals</span>
            </p>
            <a
              href="https://wa.me/2347060504211"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition hover:text-emerald-400"
            >
              <MessageCircle size={14} />
              Contact us on WhatsApp
            </a>
          </div>
        </div>
        <div className="border-t border-white/5 py-4 text-center text-[11px] text-white/30">
          © {new Date().getFullYear()} UofA Reading HUB · All rights reserved
        </div>
      </footer>
    </div>
  );
}
