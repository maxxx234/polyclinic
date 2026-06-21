import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Appointment, AppointmentStatus } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { DAYS_SHORT, formatDate } from "../../lib/format";

const FILTERS: (AppointmentStatus | "All")[] = [
  "All",
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export default function AdminAppointments() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    api
      .get<Appointment[]>("/appointments")
      .then((res) => setAppts(res.data))
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? appts.length : appts.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = filter === "All" ? appts : appts.filter((a) => a.status === filter);

  if (loading) return <SkeletonList rows={5} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">All Appointments</h1>
        <p className="text-sm text-slate-500">Every appointment across the clinic.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
            <span className={`rounded-full px-1.5 text-[10px] ${filter === f ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No appointments" message="Nothing matches this filter." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Specialty</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Slot</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-700">{a.patient?.name}</td>
                  <td className="px-5 py-3 text-slate-600">{a.doctor?.user?.name}</td>
                  <td className="px-5 py-3 text-brand-600">{a.doctor?.specialty}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(a.date)}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {DAYS_SHORT[a.slot?.dayOfWeek]} {a.slot?.startTime}–{a.slot?.endTime}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
