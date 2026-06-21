import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Stethoscope,
  IndianRupee,
  CalendarPlus,
  UserX,
  Award,
  GraduationCap,
  Languages,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Doctor, Slot } from "../../api/types";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { DAYS, DAYS_SHORT, todayISO, weekdayOf } from "../../lib/format";
import { doctorPhotoById } from "../../lib/landingImages";

export default function BookAppointment() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // profile = view full profile + book ; quickBook = jump straight to booking
  const [profile, setProfile] = useState<Doctor | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Doctor[]>("/doctors"),
      api.get<string[]>("/doctors/specialties"),
    ])
      .then(([d, s]) => {
        setDoctors(d.data);
        setSpecialties(s.data);

        // If the visitor picked a doctor on the public site before signing in,
        // open that doctor's full profile automatically.
        const pendingId = sessionStorage.getItem("pendingDoctorId");
        if (pendingId) {
          const match = d.data.find((doc) => doc._id === pendingId);
          if (match) {
            setProfile(match);
            toast.success(`Continue booking with ${match.user.name}`);
          }
          sessionStorage.removeItem("pendingDoctorId");
        }
      })
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      if (specialty && d.specialty !== specialty) return false;
      if (search) {
        const t = search.toLowerCase();
        return (
          d.user.name.toLowerCase().includes(t) ||
          d.specialty.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [doctors, specialty, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Find a Doctor</h1>
        <p className="text-sm text-slate-500">
          Browse profiles, check experience, and book an appointment.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search doctor or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select sm:max-w-xs"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">All specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No doctors found"
          message="Try a different specialty or search term."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <div
              key={d._id}
              className="card card-hover flex flex-col"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={doctorPhotoById(d._id, 160)}
                  alt={d.user.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{d.user.name}</p>
                  <p className="flex items-center gap-1 text-sm text-brand-600">
                    <Stethoscope size={13} /> {d.specialty}
                  </p>
                  {d.qualification && (
                    <p className="truncate text-xs text-slate-400">{d.qualification}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                  <Award size={12} /> {d.experience}+ yrs exp
                </span>
                <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <IndianRupee size={11} /> {d.consultationFee}
                </span>
              </div>

              {d.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{d.bio}</p>}

              <div className="mt-4 flex gap-2">
                <button className="btn-primary btn-sm flex-1" onClick={() => setProfile(d)}>
                  <BadgeCheck size={15} /> View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!profile} onClose={() => setProfile(null)} size="lg">
        {profile && <DoctorProfile doctor={profile} onBooked={() => setProfile(null)} />}
      </Modal>
    </div>
  );
}

/** Full profile view with all details + an inline booking form. */
function DoctorProfile({ doctor, onBooked }: { doctor: Doctor; onBooked: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-center text-white sm:flex-row sm:text-left">
        <img
          src={doctorPhotoById(doctor._id, 240)}
          alt={doctor.user.name}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-white/25"
        />
        <div>
          <h2 className="text-xl font-bold">{doctor.user.name}</h2>
          <p className="flex items-center justify-center gap-1.5 text-brand-50 sm:justify-start">
            <Stethoscope size={15} /> {doctor.specialty}
          </p>
          {doctor.qualification && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-brand-50/80 sm:justify-start">
              <GraduationCap size={14} /> {doctor.qualification}
            </p>
          )}
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-violet-50 p-3">
          <Award className="mx-auto text-violet-500" size={20} />
          <p className="mt-1 text-lg font-bold text-slate-800">{doctor.experience}+</p>
          <p className="text-xs text-slate-500">Years exp.</p>
        </div>
        <div className="rounded-xl bg-brand-50 p-3">
          <IndianRupee className="mx-auto text-brand-500" size={20} />
          <p className="mt-1 text-lg font-bold text-slate-800">{doctor.consultationFee}</p>
          <p className="text-xs text-slate-500">Consultation</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <Languages className="mx-auto text-blue-500" size={20} />
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {doctor.languages?.length ? doctor.languages.length : "—"}
          </p>
          <p className="text-xs text-slate-500">Languages</p>
        </div>
      </div>

      {doctor.bio && (
        <div>
          <h3 className="mb-1 text-sm font-bold text-slate-700">About</h3>
          <p className="text-sm leading-relaxed text-slate-600">{doctor.bio}</p>
        </div>
      )}

      {doctor.languages && doctor.languages.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-700">Languages spoken</h3>
          <div className="flex flex-wrap gap-2">
            {doctor.languages.map((l) => (
              <span key={l} className="badge bg-slate-100 text-slate-600">{l}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
          <CalendarPlus size={16} className="text-brand-600" /> Book an appointment
        </h3>
        <BookingForm doctor={doctor} onDone={onBooked} />
      </div>
    </div>
  );
}

function BookingForm({ doctor, onDone }: { doctor: Doctor; onDone: () => void }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotId, setSlotId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<Slot[]>(`/slots/doctor/${doctor._id}`)
      .then((res) => setSlots(res.data))
      .finally(() => setLoading(false));
  }, [doctor._id]);

  const selectedSlot = slots.find((s) => s._id === slotId);
  const dateMismatch =
    selectedSlot && date && weekdayOf(date) !== selectedSlot.dayOfWeek;

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!slotId || !date) {
      toast.error("Pick a slot and a date.");
      return;
    }
    if (dateMismatch) {
      toast.error(`This slot runs on ${DAYS[selectedSlot!.dayOfWeek]}s — pick that weekday.`);
      return;
    }
    setBusy(true);
    try {
      await api.post("/appointments", {
        doctorId: doctor._id,
        slotId,
        date,
        reason: reason || undefined,
      });
      toast.success("Appointment requested! Track it under 'My Appointments'.");
      onDone();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return <div className="py-4 text-center text-sm text-slate-400">Loading slots…</div>;
  if (slots.length === 0)
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <Clock size={16} /> This doctor has no available slots yet.
      </div>
    );

  return (
    <form onSubmit={book} className="space-y-5">
      <div>
        <label className="label">Choose a slot</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {slots.map((s) => (
            <button
              type="button"
              key={s._id}
              onClick={() => setSlotId(s._id)}
              className={`rounded-xl border px-2 py-2 text-xs transition ${
                slotId === s._id
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold">{DAYS_SHORT[s.dayOfWeek]}</span>
              {s.startTime}–{s.endTime}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">
          Date{" "}
          {selectedSlot && (
            <span className="text-xs font-normal text-slate-400">
              (must be a {DAYS[selectedSlot.dayOfWeek]})
            </span>
          )}
        </label>
        <input
          className="input"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {dateMismatch && (
          <p className="mt-1 text-xs text-rose-600">
            Pick a {DAYS[selectedSlot!.dayOfWeek]} for this slot.
          </p>
        )}
      </div>
      <div>
        <label className="label">Reason <span className="text-slate-400">(optional)</span></label>
        <textarea
          className="input"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe your symptoms briefly…"
        />
      </div>
      <button className="btn-primary w-full" disabled={busy || !!dateMismatch}>
        <CalendarPlus size={16} /> {busy ? "Booking…" : "Confirm booking"}
      </button>
    </form>
  );
}
