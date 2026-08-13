const SCENES = [
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    className: "auth-float-a left-[-8%] top-[6%] h-[42%] w-[48%]",
  },
  {
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1000&q=80",
    className: "auth-float-b right-[-6%] top-[18%] h-[38%] w-[42%]",
  },
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80",
    className: "auth-float-c left-[12%] bottom-[-4%] h-[36%] w-[40%]",
  },
  {
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=80",
    className: "auth-float-d right-[8%] bottom-[8%] h-[32%] w-[36%]",
  },
];

export default function AuthAmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070b16] via-[#0a1224] to-[#0d1a2e]" />

      <div className="auth-glow absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="auth-glow-slow absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />

      {SCENES.map((scene, i) => (
        <div
          key={i}
          className={`absolute overflow-hidden rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${scene.className}`}
        >
          <img
            src={scene.src}
            alt=""
            loading="eager"
            decoding="async"
            className="h-full w-full scale-110 object-cover opacity-40 saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e]/95 via-[#0a0f1e]/45 to-transparent" />
          <div className="absolute inset-0 bg-[#0a0f1e]/35 mix-blend-multiply" />
        </div>
      ))}

      <div className="auth-grain absolute inset-0 opacity-[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/70 via-transparent to-[#0a0f1e]/90" />
    </div>
  );
}