import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CalendarCheck,
  CalendarClock,
  Receipt,
  HeartPulse,
  Stethoscope,
  CalendarPlus,
  Quote,
  ArrowRight,
  Loader2,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, apiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import type { PatientOverview, HealthRecommendation, Review } from "../../api/types";
import { Spinner } from "../../components/Spinner";
import { Stars } from "../../components/ui/Stars";
import { inr, formatDate } from "../../lib/format";

const MOODS = [
  { emoji: "😄", label: "Great", good: true },
  { emoji: "🙂", label: "Good", good: true },
  { emoji: "😐", label: "Okay", good: true },
  { emoji: "😕", label: "Low", good: false },
  { emoji: "🤒", label: "Unwell", good: false },
];

const REC_ICON: Record<HealthRecommendation["type"], { icon: LucideIcon; tone: string }> = {
  first: { icon: Stethoscope, tone: "bg-brand-50 text-brand-600" },
  checkup: { icon: CalendarCheck, tone: "bg-blue-50 text-blue-600" },
  screening: { icon: HeartPulse, tone: "bg-violet-50 text-violet-600" },
  payment: { icon: Receipt, tone: "bg-amber-50 text-amber-600" },
  upcoming: { icon: CalendarClock, tone: "bg-emerald-50 text-emerald-600" },
  wellness: { icon: Sun, tone: "bg-rose-50 text-rose-600" },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PatientOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mood, setMood] = useState<(typeof MOODS)[number] | null>(null);

  useEffect(() => {
    api
      .get<PatientOverview>("/patient/overview")
      .then((r) => setData(r.data))
      .catch((e) => apiError(e))
      .finally(() => setLoading(false));
    api.post<{ tip: string }>("/ai/wellness-tip").then((r) => setTip(r.data.tip)).catch(() => {});
    api.get<Review[]>("/public/reviews").then((r) => setReviews(r.data.slice(0, 3))).catch(() => {});
  }, []);

  function doAction(action?: "book" | "bills") {
    if (action === "book") navigate("/patient/book");
    else if (action === "bills") navigate("/patient/bills");
  }

  if (loading) return <Spinner label="Loading your dashboard…" />;
  const name = (data?.name ?? user?.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 p-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm text-brand-50/80">{greeting()},</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{name} 👋</h1>
          <p className="mt-1 max-w-lg text-sm text-brand-50/85">
            Wishing you a healthy day! Here's a quick look at your care.
          </p>

          {/* Mood check-in */}
          <div className="mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur">
            {!mood ? (
              <>
                <p className="text-sm font-medium">How are you feeling today?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setMood(m)}
                      className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25"
                    >
                      <span className="text-lg">{m.emoji}</span> {m.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  <span className="text-lg">{mood.emoji}</span>{" "}
                  {mood.good
                    ? "Wonderful — keep taking good care of yourself! 🌿"
                    : "Sorry to hear that. Booking a consultation might help."}
                </p>
                {!mood.good && (
                  <button onClick={() => navigate("/patient/book")} className="btn bg-white text-brand-700 hover:bg-brand-50 btn-sm">
                    <CalendarPlus size={14} /> Book now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI wellness tip */}
      <div className="card flex items-start gap-3 border-brand-100 bg-brand-50/50">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">AI wellness tip</p>
          <p className="text-sm text-slate-700">
            {tip || <span className="inline-flex items-center gap-2 text-slate-400"><Loader2 size={14} className="animate-spin" /> fetching a tip…</span>}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={Stethoscope} label="Total visits" value={String(data?.stats.totalVisits ?? 0)} tone="bg-brand-50 text-brand-600" />
        <MiniStat
          icon={CalendarClock}
          label="Next appointment"
          value={data?.stats.nextAppointment ? formatDate(data.stats.nextAppointment.date) : "None"}
          tone="bg-blue-50 text-blue-600"
        />
        <MiniStat
          icon={CalendarCheck}
          label="Last visit"
          value={data?.stats.lastVisit ? formatDate(data.stats.lastVisit.date) : "—"}
          tone="bg-emerald-50 text-emerald-600"
        />
        <MiniStat icon={Receipt} label="Pending dues" value={inr(data?.stats.dues ?? 0)} tone="bg-amber-50 text-amber-600" />
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Recommended for you</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.recommendations.map((r, i) => {
            const cfg = REC_ICON[r.type];
            return (
              <div
                key={i}
                className="card card-hover flex items-start gap-3"
                style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.tone}`}>
                  <cfg.icon size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{r.title}</p>
                  <p className="text-sm text-slate-500">{r.message}</p>
                  {r.action && (
                    <button onClick={() => doAction(r.action)} className="btn-outline btn-sm mt-2">
                      {r.action === "book" ? "Book now" : "View bills"} <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testimonials + CTA */}
      {reviews.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-800">From our patients</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {reviews.map((r) => (
              <div key={r._id} className="card">
                <Quote size={20} className="text-brand-200" />
                <p className="mt-1 text-sm text-slate-600">“{r.comment}”</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{r.name}</span>
                  <Stars value={r.rating} size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row">
        <div>
          <p className="text-lg font-bold">Staying on top of your health is easy</p>
          <p className="text-sm text-slate-300">Book your next consultation in just a few clicks.</p>
        </div>
        <button onClick={() => navigate("/patient/book")} className="btn-primary">
          <CalendarPlus size={16} /> Book an Appointment
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{label}</p>
        <p className="truncate text-base font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
