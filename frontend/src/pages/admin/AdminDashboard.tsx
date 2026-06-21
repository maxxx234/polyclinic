import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import {
  Users,
  Stethoscope,
  CalendarDays,
  CalendarClock,
  IndianRupee,
  Wallet,
  Sparkles,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { api, apiError } from "../../api/client";
import type { DashboardData, DashboardInsights } from "../../api/types";
import { Spinner } from "../../components/Spinner";
import { StatCard } from "../../components/ui/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, inr } from "../../lib/format";

const STATUS_COLORS: Record<string, string> = {
  Requested: "#f59e0b",
  Confirmed: "#3b82f6",
  Completed: "#10b981",
  Cancelled: "#ef4444",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!data) return null;

  const statusData = Object.entries(data.statusBreakdown)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Clinic Dashboard</h1>
        <p className="text-sm text-slate-500">A live overview of your clinic's operations.</p>
      </div>

      <SmartInsights />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Patients" value={data.totals.patients} icon={Users} tone="blue" delay={0} />
        <StatCard label="Doctors" value={data.totals.doctors} icon={Stethoscope} tone="brand" delay={50} />
        <StatCard label="Appointments" value={data.totals.appointments} icon={CalendarDays} tone="violet" delay={100} />
        <StatCard label="Today" value={data.totals.appointmentsToday} icon={CalendarClock} tone="amber" delay={150} />
        <StatCard label="Revenue" value={inr(data.totals.revenue)} icon={IndianRupee} tone="brand" delay={200} />
        <StatCard label="Pending dues" value={inr(data.totals.pendingRevenue)} icon={Wallet} tone="rose" delay={250} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-bold text-slate-700">Appointments by status</h3>
          {statusData.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  label
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="mb-3 font-bold text-slate-700">Top specialties by demand</h3>
          {data.topSpecialties.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No appointment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={data.topSpecialties} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="specialty"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <h3 className="px-5 pt-5 font-bold text-slate-700">Recent appointments</h3>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Doctor</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentAppointments.map((a) => (
              <tr key={a._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-medium text-slate-700">{a.patient?.name}</td>
                <td className="px-5 py-3 text-slate-600">{a.doctor?.user?.name}</td>
                <td className="px-5 py-3 text-slate-500">{formatDate(a.date)}</td>
                <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {data.recentAppointments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  No appointments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** AI-written, data-driven insights paragraph + recommendations. */
function SmartInsights() {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.post<DashboardInsights>("/ai/dashboard-insights");
      setData(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Sparkles size={20} />
          </span>
          <div>
            <h3 className="font-bold text-slate-800">Smart Insights</h3>
            <p className="text-xs text-slate-500">AI-generated analysis of your clinic data</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-outline btn-sm"
          title="Regenerate"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ) : data ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">{data.summary}</p>
          {data.recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-700 ring-1 ring-brand-100">
                  <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  {r}
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-400">
            AI-generated from live data · not a substitute for professional judgement.
          </p>
        </>
      ) : null}
    </div>
  );
}
