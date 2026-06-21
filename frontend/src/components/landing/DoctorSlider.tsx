import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  GraduationCap,
  Award,
  IndianRupee,
  Languages,
  CalendarPlus,
} from "lucide-react";
import type { Doctor } from "../../api/types";
import { doctorPhotoById } from "../../lib/landingImages";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function DoctorSlider({
  doctors,
  onBook,
}: {
  doctors: Doctor[];
  onBook: (doctorId?: string) => void;
}) {
  const pages = chunk(doctors, 2); // two doctors at a time
  const [page, setPage] = useState(0);

  if (doctors.length === 0) {
    return <p className="mt-10 text-center text-sm text-slate-500">Loading doctors…</p>;
  }

  const go = (n: number) => setPage((n + pages.length) % pages.length);

  return (
    <div className="relative mt-10">
      {/* Side arrows (desktop) */}
      <button
        onClick={() => go(page - 1)}
        className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-brand-300 hover:text-brand-600 lg:flex"
        aria-label="Previous doctors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(page + 1)}
        className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-brand-300 hover:text-brand-600 lg:flex"
        aria-label="More doctors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pair, pi) => (
            <div key={pi} className="grid w-full shrink-0 gap-5 sm:grid-cols-2">
              {pair.map((d) => (
                <DoctorCard key={d._id} doctor={d} onBook={onBook} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          onClick={() => go(page - 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 lg:hidden"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? "w-7 bg-brand-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(page + 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-600 lg:hidden"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function DoctorCard({
  doctor,
  onBook,
}: {
  doctor: Doctor;
  onBook: (doctorId?: string) => void;
}) {
  return (
    <div className="card card-hover flex flex-col overflow-hidden p-0">
      {/* Photo */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={doctorPhotoById(doctor._id)}
          alt={doctor.user.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <span className="absolute left-3 top-3 badge bg-white/90 text-brand-700 shadow">
          <Stethoscope size={12} /> {doctor.specialty}
        </span>
        <span className="absolute right-3 top-3 badge bg-violet-600/90 text-white shadow">
          <Award size={12} /> {doctor.experience}+ yrs
        </span>
      </div>

      {/* Info — vertical */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-800">{doctor.user.name}</h3>
        {doctor.qualification && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <GraduationCap size={14} className="text-brand-500" /> {doctor.qualification}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <IndianRupee size={14} className="text-brand-500" /> ₹{doctor.consultationFee} fee
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Award size={14} className="text-violet-500" /> {doctor.experience} yrs exp.
          </div>
        </div>

        {doctor.languages && doctor.languages.length > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Languages size={13} /> {doctor.languages.join(", ")}
          </p>
        )}

        {doctor.bio && (
          <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-500">{doctor.bio}</p>
        )}

        <button onClick={() => onBook(doctor._id)} className="btn-primary mt-4 w-full">
          <CalendarPlus size={16} /> Book Appointment
        </button>
      </div>
    </div>
  );
}
