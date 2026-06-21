import { useState } from "react";
import {
  Sparkles,
  Stethoscope,
  AlertTriangle,
  Activity,
  ShieldAlert,
  CalendarPlus,
  Loader2,
  Lightbulb,
  Award,
  IndianRupee,
  Plus,
} from "lucide-react";
import { api, apiError } from "../api/client";
import type { SymptomResult } from "../api/types";
import { doctorPhotoById } from "../lib/landingImages";

// Tap to add — patients can stack several symptoms together, grouped by area.
const SYMPTOM_GROUPS: { category: string; items: string[] }[] = [
  { category: "General", items: ["Fever", "Fatigue", "Body ache", "Chills", "Weight loss", "Loss of appetite", "Night sweats"] },
  { category: "Head & nerves", items: ["Headache", "Dizziness", "Migraine", "Blurred vision", "Memory problems", "Numbness", "Tremors"] },
  { category: "Respiratory", items: ["Cough", "Sore throat", "Breathlessness", "Chest congestion", "Runny nose", "Sneezing", "Wheezing"] },
  { category: "Heart", items: ["Chest pain", "Palpitations", "Irregular heartbeat", "Swollen ankles"] },
  { category: "Digestive", items: ["Nausea", "Vomiting", "Stomach pain", "Diarrhea", "Constipation", "Acidity", "Bloating"] },
  { category: "Skin & hair", items: ["Skin rash", "Itching", "Acne", "Hair loss", "Dry skin"] },
  { category: "Bones & joints", items: ["Joint pain", "Back pain", "Knee pain", "Swelling", "Stiffness"] },
  { category: "ENT, eye & teeth", items: ["Ear pain", "Hearing loss", "Eye redness", "Toothache", "Nasal block"] },
  { category: "Urinary", items: ["Frequent urination", "Burning urination"] },
  { category: "Mind & sleep", items: ["Anxiety", "Low mood", "Insomnia", "Stress"] },
];

const URGENCY: Record<string, { cls: string; label: string; icon: typeof Activity }> = {
  low: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Low urgency", icon: Activity },
  medium: { cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "Medium urgency", icon: AlertTriangle },
  high: { cls: "bg-rose-50 text-rose-700 ring-rose-200", label: "High urgency", icon: ShieldAlert },
};

export function SymptomChecker({ onBook }: { onBook: (doctorId: string) => void }) {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyze(e?: React.FormEvent) {
    e?.preventDefault();
    if (symptoms.trim().length < 3) {
      setError("Please describe your symptoms.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post<SymptomResult>("/ai/symptom-check", { symptoms });
      setResult(res.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  // Append a symptom to the list (comma-separated), skipping duplicates.
  function addSymptom(symptom: string) {
    setSymptoms((prev) => {
      const parts = prev
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.some((p) => p.toLowerCase() === symptom.toLowerCase())) return prev;
      return [...parts, symptom].join(", ");
    });
    setError("");
  }

  const selected = symptoms
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const u = result ? URGENCY[result.urgency] ?? URGENCY.medium : null;

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={analyze} className="card">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Sparkles size={18} />
          </span>
          <div>
            <h3 className="font-bold text-slate-800">AI Symptom Checker</h3>
            <p className="text-xs text-slate-500">Describe how you feel — we'll suggest the right specialist.</p>
          </div>
        </div>

        <textarea
          className="input mt-4"
          rows={3}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. I've had a sore throat, mild fever and body ache for 3 days…"
        />

        <p className="mt-3 text-xs font-medium text-slate-400">
          Tap to add symptoms — combine as many as you have:
        </p>
        <div className="mt-2 max-h-56 space-y-3 overflow-y-auto pr-1">
          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.category}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((sym) => {
                  const added = selected.includes(sym.toLowerCase());
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => addSymptom(sym)}
                      disabled={added}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                        added
                          ? "cursor-default bg-brand-100 text-brand-700 ring-1 ring-brand-300"
                          : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                      }`}
                    >
                      {added ? <Activity size={12} /> : <Plus size={12} />}
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}

        <button className="btn-primary mt-4 w-full sm:w-auto" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? "Analyzing…" : "Analyze symptoms"}
        </button>
      </form>

      {result && u && (
        <div className="mt-5 space-y-4" style={{ animation: "var(--animate-slide-up)" }}>
          {/* Specialty + urgency */}
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Stethoscope size={24} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Recommended specialty</p>
                <p className="text-xl font-bold text-slate-800">{result.specialty}</p>
              </div>
            </div>
            <span className={`badge ring-1 ${u.cls}`}>
              <u.icon size={13} /> {u.label}
            </span>
          </div>

          {/* Conditions + advice */}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Possible related conditions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.possibleConditions.map((c) => (
                <span key={c} className="badge bg-slate-100 text-slate-700 capitalize">{c}</span>
              ))}
            </div>
            <div className="mt-4 flex gap-2 rounded-xl bg-brand-50/60 p-3 text-sm text-slate-700">
              <Lightbulb size={18} className="shrink-0 text-brand-600" />
              <p>{result.advice}</p>
            </div>
          </div>

          {/* Recommended doctors */}
          {result.doctors.length > 0 && (
            <div className="card">
              <p className="mb-3 text-sm font-bold text-slate-700">
                {result.specialty} specialists you can book
              </p>
              <div className="space-y-3">
                {result.doctors.map((d) => (
                  <div key={d._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <img src={doctorPhotoById(d._id, 120)} alt={d.user.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-semibold text-slate-800">{d.user.name}</p>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Award size={12} /> {d.experience}+ yrs</span>
                          <span className="flex items-center gap-1"><IndianRupee size={11} /> {d.consultationFee}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onBook(d._id)} className="btn-primary btn-sm">
                      <CalendarPlus size={14} /> Book
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
