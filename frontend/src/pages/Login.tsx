import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Quote,
  ArrowRight,
  Stethoscope,
  Award,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, apiError } from "../api/client";
import type { Review, Doctor } from "../api/types";
import { img, doctorPhotoById } from "../lib/landingImages";
import { Stars } from "../components/ui/Stars";

const SLIDES = [
  {
    id: "1612349317150-e413f6a5b16d",
    title: "Your Health, Our Commitment",
    sub: "Compassionate care from doctors who truly listen.",
  },
  {
    id: "1559839734-2b71ea197ec2",
    title: "Trusted by Thousands of Families",
    sub: "A decade of dependable, quality healthcare.",
  },
  {
    id: "1576091160550-2173dba999ef",
    title: "Care That Feels Like Family",
    sub: "We're with you at every step of your journey.",
  },
];

const TRUST = [
  "100% verified specialists",
  "Secure & private records",
  "Same-day appointments",
];

const DEMO = [
  { label: "Admin", email: "admin@clinic.com", password: "Admin@123", tone: "violet" },
  { label: "Doctor", email: "arjun@clinic.com", password: "Doctor@123", tone: "blue" },
  { label: "Patient", email: "rahul@example.com", password: "Patient@123", tone: "brand" },
];

const TONE: Record<string, string> = {
  violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  brand: "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [slide, setSlide] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  // A doctor chosen on the public site before signing in (keep it for the
  // booking page — we only read it here, we don't clear it).
  const pendingId = useMemo(() => sessionStorage.getItem("pendingDoctorId"), []);
  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);

  // Rotate hero slides (only matters in default mode)
  useEffect(() => {
    if (pendingId) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, [pendingId]);

  useEffect(() => {
    api.get<Review[]>("/public/reviews").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  // Load the chosen doctor's details for the left panel.
  useEffect(() => {
    if (!pendingId) return;
    api
      .get<Doctor[]>("/public/doctors")
      .then((r) => setPendingDoctor(r.data.find((d) => d._id === pendingId) ?? null))
      .catch(() => {});
  }, [pendingId]);

  const review = reviews.length ? reviews[slide % reviews.length] : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(
        user.role === "admin"
          ? "/admin"
          : user.role === "doctor"
            ? "/doctor/appointments"
            : pendingId
              ? "/patient/book" // continue the doctor they picked
              : "/patient/home"
      );
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  function fill(d: (typeof DEMO)[number]) {
    setEmail(d.email);
    setPassword(d.password);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ===== Left panel ===== */}
      <div className="relative hidden overflow-hidden lg:block">
        {pendingId ? (
          /* --- Booking-with-doctor mode: show the chosen doctor's photo --- */
          <>
            <img
              src={doctorPhotoById(pendingId, 1200)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scale(1.05)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/75 to-slate-900/85" />

            <div className="relative flex h-full flex-col justify-between p-12 text-white">
              <Link to="/" className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <HeartPulse size={24} />
                </span>
                <span className="text-xl font-bold">Polyclinic</span>
              </Link>

              <div style={{ animation: "var(--animate-slide-up)" }}>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <CalendarCheck size={14} /> Almost there
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight">
                  You're booking an appointment with
                </h2>

                {/* Doctor card */}
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <img
                    src={doctorPhotoById(pendingId, 200)}
                    alt={pendingDoctor?.user.name ?? "Doctor"}
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <p className="text-lg font-bold">
                      {pendingDoctor?.user.name ?? "Your selected doctor"}
                    </p>
                    {pendingDoctor && (
                      <>
                        <p className="flex items-center gap-1.5 text-sm text-brand-100">
                          <Stethoscope size={14} /> {pendingDoctor.specialty}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-50/70">
                          <Award size={13} /> {pendingDoctor.experience}+ years experience
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <p className="mt-5 max-w-md text-sm text-brand-50/80">
                  Sign in or create an account to confirm your booking — you'll be taken
                  straight to {pendingDoctor ? `${pendingDoctor.user.name}'s` : "the doctor's"} profile.
                </p>

                <div className="mt-6 space-y-2.5">
                  {TRUST.map((t) => (
                    <div key={t} className="flex items-center gap-2.5 text-sm text-brand-50/90">
                      <CheckCircle2 size={17} className="text-brand-300" /> {t}
                    </div>
                  ))}
                </div>
              </div>

              <div />
            </div>
          </>
        ) : (
          /* --- Default mode: rotating images + trust --- */
          <>
            {SLIDES.map((s, idx) => (
              <div
                key={s.id}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: idx === slide ? 1 : 0 }}
              >
                <img
                  src={img(s.id, 1200, 70)}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    transform: idx === slide ? "scale(1.1)" : "scale(1)",
                    transition: "transform 6s ease-out",
                  }}
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/85 via-brand-800/70 to-slate-900/80" />

            <div className="relative flex h-full flex-col justify-between p-12 text-white">
              <Link to="/" className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <HeartPulse size={24} />
                </span>
                <span className="text-xl font-bold">Polyclinic</span>
              </Link>

              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <ShieldCheck size={14} /> Trusted healthcare platform
                </span>
                <div className="mt-5 min-h-[120px]">
                  <h2 key={slide} className="text-4xl font-bold leading-tight" style={{ animation: "var(--animate-slide-up)" }}>
                    {SLIDES[slide].title}
                  </h2>
                  <p key={`s${slide}`} className="mt-3 max-w-md text-brand-50/80" style={{ animation: "var(--animate-fade-in)" }}>
                    {SLIDES[slide].sub}
                  </p>
                </div>

                <div className="mt-6 space-y-2.5">
                  {TRUST.map((t) => (
                    <div key={t} className="flex items-center gap-2.5 text-sm text-brand-50/90">
                      <CheckCircle2 size={17} className="text-brand-300" /> {t}
                    </div>
                  ))}
                </div>

                {review && (
                  <div
                    key={review._id}
                    className="mt-8 max-w-md rounded-2xl bg-white/10 p-5 backdrop-blur"
                    style={{ animation: "var(--animate-slide-up)" }}
                  >
                    <Quote size={20} className="text-brand-300" />
                    <p className="mt-1 text-sm italic text-brand-50/90">“{review.comment}”</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold">— {review.name}</span>
                      <Stars value={review.rating} size={14} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === slide ? "w-7 bg-brand-300" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== Right: form ===== */}
      <div className="flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 py-10">
        <div className="w-full max-w-md" style={{ animation: "var(--animate-slide-up)" }}>
          <Link to="/" className="mb-8 flex flex-col items-center lg:hidden">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white">
              <HeartPulse size={24} />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Polyclinic</h1>
          </Link>

          {/* Mobile: show chosen doctor banner */}
          {pendingId && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-3 lg:hidden">
              <img
                src={doctorPhotoById(pendingId, 120)}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="text-sm">
                <p className="font-semibold text-slate-800">
                  Booking with {pendingDoctor?.user.name ?? "your doctor"}
                </p>
                <p className="text-xs text-slate-500">Sign in to continue</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back 👋</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to access your portal.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="group">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
                  <input
                    className="input pl-10"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
                  <input
                    className="input px-10"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button className="btn-primary group w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
                {!busy && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              New patient?{" "}
              <Link to="/register" className="font-semibold text-brand-600 hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 backdrop-blur">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick demo login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fill(d)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition active:scale-95 ${TONE[d.tone]}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Click a role to autofill, then press Sign in.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link to="/" className="hover:text-brand-600">← Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
