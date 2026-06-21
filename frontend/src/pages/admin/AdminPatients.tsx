import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Users, BellRing, UserPlus, Activity, Phone, Mail } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { AdminPatientsResponse, AdminPatient } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { inr, formatDate } from "../../lib/format";

const FOLLOW: Record<string, { cls: string; label: string }> = {
  due: { cls: "bg-rose-50 text-rose-700 ring-rose-200", label: "Due for follow-up" },
  new: { cls: "bg-blue-50 text-blue-700 ring-blue-200", label: "New patient" },
  active: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Active" },
};

const FILTERS = ["All", "due", "new", "active"] as const;
const FILTER_LABEL: Record<string, string> = { All: "All", due: "Due", new: "New", active: "Active" };

export default function AdminPatients() {
  const [data, setData] = useState<AdminPatientsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    api
      .get<AdminPatientsResponse>("/admin/patients")
      .then((r) => setData(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonList rows={5} />;
  if (!data) return null;

  const visible =
    filter === "All" ? data.records : data.records.filter((r) => r.followUp === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Records</h1>
        <p className="text-sm text-slate-500">
          Track patient visits and spot who's due for a follow-up to recommend appointments.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Total patients" value={data.summary.total} tone="bg-brand-50 text-brand-600" />
        <Stat icon={BellRing} label="Due for follow-up" value={data.summary.due} tone="bg-rose-50 text-rose-600" />
        <Stat icon={UserPlus} label="New patients" value={data.summary.newPatients} tone="bg-blue-50 text-blue-600" />
        <Stat icon={Activity} label="Active" value={data.summary.active} tone="bg-emerald-50 text-emerald-600" />
      </div>

      {data.summary.due > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <BellRing size={16} />
          <span>
            <b>{data.summary.due}</b> patient{data.summary.due > 1 ? "s" : ""} haven't visited in over 3 months —
            a great opportunity to recommend a check-up.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Users} title="No patients here" message="Nothing matches this filter." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Visits</th>
                <th className="px-5 py-3">Last visit</th>
                <th className="px-5 py-3">Dues</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <PatientRow key={p._id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PatientRow({ p }: { p: AdminPatient }) {
  const f = FOLLOW[p.followUp];
  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
            {p.name.charAt(0)}
          </span>
          <div>
            <p className="font-semibold text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-400">
              {p.age ? `${p.age} yrs` : "—"}
              {p.gender ? ` · ${p.gender}` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone size={12} /> {p.phone ?? "—"}</p>
        <p className="flex items-center gap-1.5 text-xs text-slate-400"><Mail size={12} /> {p.email}</p>
      </td>
      <td className="px-5 py-3 font-semibold text-slate-700">{p.totalVisits}</td>
      <td className="px-5 py-3 text-slate-500">{p.lastVisit ? formatDate(p.lastVisit) : "Never"}</td>
      <td className="px-5 py-3">
        {p.dues > 0 ? (
          <span className="font-semibold text-amber-600">{inr(p.dues)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3">
        <span className={`badge ring-1 ${f.cls}`}>{f.label}</span>
      </td>
    </tr>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
