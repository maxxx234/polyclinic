import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Clock, FileText, XCircle, Receipt } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Appointment } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, inr } from "../../lib/format";

export default function MyAppointments() {
  const confirm = useConfirm();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Appointment | null>(null);

  async function load() {
    try {
      const res = await api.get<Appointment[]>("/appointments/mine");
      setAppts(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    const ok = await confirm({
      title: "Cancel appointment?",
      message: "This will free the slot for other patients.",
      confirmText: "Yes, cancel",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/appointments/${id}/status`, { status: "Cancelled" });
      toast.success("Appointment cancelled");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  if (loading) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
        <p className="text-sm text-slate-500">Track and manage your visits.</p>
      </div>

      {appts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments yet"
          message="Book your first appointment from the Book Appointment tab."
        />
      ) : (
        <div className="space-y-3">
          {appts.map((a, i) => (
            <div
              key={a._id}
              className="card card-hover flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                  {a.doctor?.user?.name?.replace(/^Dr\.?\s*/, "").charAt(0)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">{a.doctor?.user?.name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm text-brand-600">{a.doctor?.specialty}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <CalendarDays size={14} /> {formatDate(a.date)}
                    <span className="text-slate-300">·</span>
                    <Clock size={14} /> {a.slot?.startTime}–{a.slot?.endTime}
                  </p>
                  {a.reason && (
                    <p className="mt-1 text-xs text-slate-400">Reason: {a.reason}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {a.bill && (
                  <span
                    className={`badge ${
                      a.bill.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    <Receipt size={12} /> {inr(a.bill.amount)} · {a.bill.status}
                  </span>
                )}
                {a.prescription && (
                  <button className="btn-outline btn-sm" onClick={() => setViewing(a)}>
                    <FileText size={14} /> Prescription
                  </button>
                )}
                {(a.status === "Requested" || a.status === "Confirmed") && (
                  <button className="btn-danger btn-sm" onClick={() => cancel(a._id)}>
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!viewing?.prescription}
        onClose={() => setViewing(null)}
        title="Prescription"
        subtitle={
          viewing ? `${viewing.doctor?.user?.name} · ${formatDate(viewing.date)}` : ""
        }
      >
        {viewing?.prescription && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-1 font-semibold text-slate-700">Clinical notes</p>
              <p className="text-slate-600">{viewing.prescription.notes}</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="mb-1 font-semibold text-brand-700">Medicines</p>
              <p className="text-slate-700">{viewing.prescription.medicines || "—"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
