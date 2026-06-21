import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SPECIALITIES, type Speciality } from "../../lib/specialities";
import { SPECIALITY_IMAGE, img } from "../../lib/landingImages";

// Split specialities into slides of 4 -> 2 slides.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function SpecialitySlider() {
  const slides = chunk(SPECIALITIES, 4);
  const [page, setPage] = useState(0);
  const go = (n: number) => setPage((n + slides.length) % slides.length);

  return (
    <div className="mt-10">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {slides.map((group, gi) => (
            <div key={gi} className="grid w-full shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.map((s) => (
                <SpecialityCard key={s.name} s={s} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          onClick={() => go(page - 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? "w-7 bg-brand-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(page + 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function SpecialityCard({ s }: { s: Speciality }) {
  const photo = SPECIALITY_IMAGE[s.name];
  return (
    <div>
      <div className="group relative h-48 overflow-hidden rounded-2xl shadow-sm">
        {/* Photo */}
        {photo ? (
          <img
            src={img(photo, 600, 65)}
            alt={s.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={`h-full w-full ${s.tone}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

        {/* Icon chip */}
        <div className={`absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl ${s.tone} shadow`}>
          <s.icon size={20} />
        </div>

        {/* Info panel slides in from the right on hover */}
        <div className="absolute inset-0 flex translate-x-full flex-col justify-center bg-brand-700/95 p-5 text-white transition-transform duration-300 ease-out group-hover:translate-x-0">
          <s.icon size={26} className="text-brand-200" />
          <h4 className="mt-2 text-lg font-bold">{s.name}</h4>
          <p className="mt-1 text-sm text-brand-50/90">{s.description}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-200">
            Learn more <ArrowRight size={13} />
          </span>
        </div>
      </div>
      <p className="mt-3 text-center font-semibold text-slate-800">{s.name}</p>
    </div>
  );
}
