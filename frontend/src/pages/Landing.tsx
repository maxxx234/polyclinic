import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Menu,
  X,
  CalendarPlus,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Quote,
  Users,
  Award,
  Smile,
  Stethoscope,
  HeartHandshake,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Doctor, Review, PublicStats } from "../api/types";
import { Stars } from "../components/ui/Stars";
import { HeroSlider } from "../components/landing/HeroSlider";
import { SpecialitySlider } from "../components/landing/SpecialitySlider";
import { DoctorSlider } from "../components/landing/DoctorSlider";
import { Faq } from "../components/landing/Faq";
import { SymptomChecker } from "../components/SymptomChecker";
import { ChatBot } from "../components/ChatBot";
import { img, ABOUT_IMAGE, WHO_WE_ARE_STRIP } from "../lib/landingImages";

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Symptom Checker", href: "#symptom-checker" },
  { label: "Find a Doctor", href: "#doctors" },
  { label: "Specialities", href: "#specialities" },
  { label: "About Us", href: "#about" },
  { label: "Patient Corner", href: "#patient-corner" },
  { label: "Contact Us", href: "#contact" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get<Doctor[]>("/public/doctors"),
      api.get<Review[]>("/public/reviews"),
      api.get<PublicStats>("/public/stats"),
    ]).then(([d, r, s]) => {
      if (d.status === "fulfilled") setDoctors(d.value.data);
      if (r.status === "fulfilled") setReviews(r.value.data);
      if (s.status === "fulfilled") setStats(s.value.data);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goBook(doctorId?: string) {
    // Remember the chosen doctor so the booking page can pre-open their profile
    // — even after the visitor signs in first.
    if (doctorId) sessionStorage.setItem("pendingDoctorId", doctorId);
    else sessionStorage.removeItem("pendingDoctorId");

    if (user?.role === "patient") navigate("/patient/book");
    else if (user) navigate("/home");
    else navigate("/login");
  }

  const portalHref = user
    ? user.role === "admin"
      ? "/admin"
      : user.role === "doctor"
        ? "/doctor/appointments"
        : "/patient/book"
    : "/login";

  return (
    <div className="min-h-screen bg-white">
      {/* ===== Navbar ===== */}
      <header
        className={`fixed top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-100 bg-white/90 py-1.5 shadow-sm backdrop-blur"
            : "bg-white/60 py-3 backdrop-blur-sm"
        }`}
        style={{ animation: "var(--animate-fade-in)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
          <a href="#home" className="group flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <HeartPulse size={22} />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold text-slate-800">Polyclinic</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-brand-600">
                Multi-Specialty Care
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="group relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-brand-700"
              >
                {n.label}
                <span className="absolute bottom-1 left-3 h-0.5 w-0 rounded-full bg-brand-500 transition-all duration-300 group-hover:w-[calc(100%-1.5rem)]" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={portalHref}
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-brand-700 sm:block"
            >
              {user ? "My Portal" : "Login"}
            </a>
            <button onClick={() => goBook()} className="btn-primary btn-sm hidden sm:inline-flex">
              <CalendarPlus size={15} /> Book Appointment
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {n.label}
              </a>
            ))}
            <button onClick={() => goBook()} className="btn-primary mt-2 w-full">
              <CalendarPlus size={16} /> Book Appointment
            </button>
          </div>
        )}
      </header>

      {/* ===== Hero slider ===== */}
      <HeroSlider onBook={goBook} />

      {/* ===== AI Symptom Checker ===== */}
      <section id="symptom-checker" className="scroll-mt-24 bg-gradient-to-b from-brand-50/60 to-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading
            eyebrow="Powered by AI"
            title="Not sure which doctor to see?"
            subtitle="Describe your symptoms and our AI assistant will suggest the right specialist — instantly."
          />
          <div className="mt-10">
            <SymptomChecker onBook={(id) => goBook(id)} />
          </div>
        </div>
      </section>

      {/* ===== Specialities ===== */}
      <section id="specialities" className="scroll-mt-24 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading
            eyebrow="What we treat"
            title="Our Specialities"
            subtitle="Comprehensive care across a wide range of medical specialities, delivered by experienced doctors."
          />
          <SpecialitySlider />
        </div>
      </section>

      {/* ===== Find a Doctor ===== */}
      <section id="doctors" className="scroll-mt-24 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <SectionHeading
            eyebrow="Meet our team"
            title="Find a Doctor"
            subtitle="Explore our panel of qualified specialists — slide through to discover more."
          />
          <DoctorSlider doctors={doctors} onBook={goBook} />
        </div>
      </section>

      {/* ===== About Us ===== */}
      <section id="about" className="scroll-mt-24 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-8">
          {/* Image collage */}
          <div className="relative" style={{ animation: "var(--animate-slide-up)" }}>
            <img
              src={img(ABOUT_IMAGE, 800)}
              alt="Our medical team"
              className="h-[360px] w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100 sm:block">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <HeartHandshake size={22} />
                </span>
                <div>
                  <p className="text-xl font-bold text-slate-800">15+ Years</p>
                  <p className="text-xs text-slate-500">of trusted care</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="Who we are" title="Caring for Your Family Like Our Own" align="left" />
            <p className="mt-5 text-slate-600">
              Polyclinic is a modern multi-specialty healthcare facility committed to making
              quality medical care accessible, transparent and convenient. We combine
              experienced doctors with smart technology so you spend less time waiting and
              more time getting better.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, text: "Qualified & verified specialists" },
                { icon: Clock, text: "Same-day online booking" },
                { icon: HeartPulse, text: "Personalised, caring treatment" },
                { icon: Sparkles, text: "Digital records & prescriptions" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <f.icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Featured testimonial */}
            {reviews[0] && (
              <div className="mt-7 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
                <Quote className="text-brand-300" size={22} />
                <p className="mt-1 text-sm italic text-slate-700">“{reviews[0].comment}”</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">— {reviews[0].name}</p>
                  <Stars value={reviews[0].rating} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Who We Are / stats band with auto-sliding image ===== */}
      <section className="bg-gradient-to-br from-brand-600 to-emerald-800 py-16 text-white lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">Why choose us</p>
            <h2 className="mt-1 text-3xl font-bold">Trusted by Families, Backed by Numbers</h2>
            <p className="mt-3 max-w-md text-brand-50/80">
              A decade of compassionate care, thousands of happy patients, and a team that
              treats you like family.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat value={stats?.doctors ?? 0} suffix="+" label="Doctors" icon={Stethoscope} />
              <Stat value={stats?.patients ?? 0} suffix="+" label="Patients" icon={Users} />
              <Stat value={stats?.specialties ?? 0} suffix="+" label="Specialities" icon={Award} />
              <Stat value={stats?.reviews ?? 0} suffix="+" label="Reviews" icon={Smile} />
            </div>
          </div>
          <AutoImageWindow />
        </div>
      </section>

      {/* ===== Patient Corner (testimonials) ===== */}
      <section id="patient-corner" className="scroll-mt-24 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading
            eyebrow="Patient Corner"
            title="What Our Patients Say"
            subtitle="Real experiences and reviews shared by our patients."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
            {reviews.map((r, i) => (
              <div
                key={r._id}
                className="card card-hover flex flex-col"
                style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
              >
                <Quote className="text-brand-200" size={28} />
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">“{r.comment}”</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                      {r.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      {r.treatmentFor && <p className="text-xs text-slate-400">{r.treatmentFor}</p>}
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
              </div>
            ))}
          </div>
          {user?.role === "patient" && (
            <div className="mt-8 text-center">
              <button onClick={() => navigate("/patient/reviews")} className="btn-outline">
                Share your experience <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-24 bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading
            eyebrow="Need help?"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about booking and visiting us."
          />
          <Faq />
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
            <HelpCircle size={16} className="text-brand-600" />
            Still have questions? <a href="#contact" className="font-semibold text-brand-600 hover:underline">Contact us</a>
          </p>
        </div>
      </section>

      {/* ===== Contact & Location footer ===== */}
      <footer id="contact" className="scroll-mt-24 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                  <HeartPulse size={22} />
                </span>
                <p className="text-xl font-bold text-white">Polyclinic</p>
              </div>
              <p className="mt-4 max-w-md text-sm text-slate-400">
                Modern multi-specialty healthcare, built around your convenience. Reach out —
                we're here to help.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-brand-400"><MapPin size={17} /></span>
                  123 Health Avenue, MG Road, Bengaluru, Karnataka 560001
                </p>
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-brand-400"><Phone size={17} /></span>
                  +91 98765 43210
                </p>
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-brand-400"><Mail size={17} /></span>
                  care@polyclinic.com
                </p>
                <p className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-brand-400"><Clock size={17} /></span>
                  Mon–Sat · 9:00 AM – 8:00 PM
                </p>
              </div>
              <button onClick={() => goBook()} className="btn-primary mt-7">
                <CalendarPlus size={16} /> Book an Appointment
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="Clinic location"
                src="https://www.google.com/maps?q=MG%20Road%20Bengaluru&output=embed"
                className="h-72 w-full lg:h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© 2026 Polyclinic. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#specialities" className="hover:text-brand-400">Specialities</a>
              <a href="#doctors" className="hover:text-brand-400">Doctors</a>
              <a href="#patient-corner" className="hover:text-brand-400">Reviews</a>
              <a href="#faq" className="hover:text-brand-400">FAQ</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}

/** Animated count-up stat for the band. */
function Stat({
  value,
  suffix,
  label,
  icon: Icon,
}: {
  value: number;
  suffix?: string;
  label: string;
  icon: typeof Users;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
      <Icon size={22} className="mx-auto text-brand-200" />
      <p className="mt-2 text-3xl font-bold">
        {n}
        {suffix}
      </p>
      <p className="text-xs text-brand-50/80">{label}</p>
    </div>
  );
}

/** Auto-rotating framed image window (crossfade). */
function AutoImageWindow() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % WHO_WE_ARE_STRIP.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20 lg:h-80">
      {WHO_WE_ARE_STRIP.map((id, idx) => (
        <img
          key={id}
          src={img(id, 800)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {WHO_WE_ARE_STRIP.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
      <h2 className="mt-1 text-3xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-500">{subtitle}</p>}
    </div>
  );
}
