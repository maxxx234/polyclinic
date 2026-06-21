import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { HERO_SLIDES, img } from "../../lib/landingImages";

export function HeroSlider({ onBook }: { onBook: () => void }) {
  const [i, setI] = useState(0);
  const count = HERO_SLIDES.length;

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  const go = (n: number) => setI((n + count) % count);

  return (
    <section id="home" className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
      {/* Slides */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: idx === i ? 1 : 0 }}
        >
          <img
            src={img(s.id, 1600, 70)}
            alt=""
            className="h-full w-full object-cover"
            style={{
              transform: idx === i ? "scale(1.08)" : "scale(1)",
              transition: "transform 6s ease-out",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 lg:px-8">
        <div className="max-w-2xl text-white">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"
            style={{ animation: "var(--animate-fade-in)" }}
          >
            <ShieldCheck size={14} /> Caring for families since 2010
          </span>

          {/* Main heading (persistent) */}
          <h1 className="mt-5 text-4xl font-bold leading-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
            We Are Your <span className="text-brand-300">Family Doctors</span>
          </h1>

          {/* Rotating sub-line per slide */}
          <div className="mt-4 h-7 overflow-hidden">
            <p key={i} className="text-lg text-slate-100/90" style={{ animation: "var(--animate-slide-up)" }}>
              {HERO_SLIDES[i].sub}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onBook} className="btn-primary">
              <CalendarPlus size={17} /> Book an Appointment
            </button>
            <a href="#doctors" className="btn bg-white/10 text-white backdrop-blur hover:bg-white/20">
              <Stethoscope size={17} /> Find a Doctor
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-100/80">
            {["Trusted specialists", "Same-day booking", "Transparent billing"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-brand-300" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(i - 1)}
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 lg:block"
        aria-label="Previous"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={() => go(i + 1)}
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur transition hover:bg-white/30 lg:block"
        aria-label="Next"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-7 bg-brand-400" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
