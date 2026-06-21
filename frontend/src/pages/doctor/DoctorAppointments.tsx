import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  Phone,
  CheckCircle2,
  CircleCheckBig,
  XCircle,
  FileText,
  Stethoscope,
} from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Appointment, AppointmentStatus } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";

const FILTERS: (AppointmentStatus | "All")[] = [
  "All",
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export default function DoctorAppointments() {
  const confirm = useConfirm();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [prescribing, setPrescribing] = useState<Appointment | null>(null);

  async function load() {
    try {
      const res = await api.get<Appointment[]>("/appointments/doctor");
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

  async function setStatus(id: string, status: AppointmentStatus, ask?: string) {
    if (ask) {
      const ok = await confirm({
        title: ask,
        danger: status === "Cancelled",
        confirmText: "Yes",
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Marked ${status}`);
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? appts.length : appts.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = filter === "All" ? appts : appts.filter((a) => a.status === filter);

  if (loading) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
        <p className="text-sm text-slate-500">Manage your patient appointments and prescriptions.</p>
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
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                filter === f ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No appointments here" message="Nothing matches this filter." />
      ) : (
        <div className="space-y-3">
          {visible.map((a, i) => (
            <div
              key={a._id}
              className="card card-hover flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">
                  {a.patient?.name?.charAt(0)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">{a.patient?.name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                    <CalendarDays size={14} /> {formatDate(a.date)}
                    <span className="text-slate-300">·</span>
                    <Clock size={14} /> {a.slot?.startTime}–{a.slot?.endTime}
                    {a.patient?.phone && (
                      <>
                        <span className="text-slate-300">·</span>
                        <Phone size={13} /> {a.patient.phone}
                      </>
                    )}
                  </p>
                  {a.reason && <p className="mt-1 text-xs text-slate-400">Reason: {a.reason}</p>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {a.status === "Requested" && (
                  <button className="btn-primary btn-sm" onClick={() => setStatus(a._id, "Confirmed")}>
                    <CheckCircle2 size={14} /> Confirm
                  </button>
                )}
                {(a.status === "Requested" || a.status === "Confirmed") && (
                  <>
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => setStatus(a._id, "Completed", "Mark this visit as completed?")}
                    >
                      <CircleCheckBig size={14} /> Complete
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => setStatus(a._id, "Cancelled", "Cancel this appointment?")}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  </>
                )}
                {a.status === "Completed" && (
                  <button className="btn-outline btn-sm" onClick={() => setPrescribing(a)}>
                    <FileText size={14} /> {a.prescription ? "Edit Rx" : "Add Rx"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!prescribing}
        onClose={() => setPrescribing(null)}
        title="Prescription"
        subtitle={prescribing ? `For ${prescribing.patient?.name}` : ""}
      >
        {prescribing && (
          <PrescriptionForm
            appointment={prescribing}
            onDone={() => {
              setPrescribing(null);
              load();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function PrescriptionForm({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState(appointment.prescription?.notes ?? "");
  const [medicines, setMedicines] = useState(appointment.prescription?.medicines ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/prescriptions/appointment/${appointment._id}`, { notes, medicines });
      toast.success("Prescription saved");
      onDone();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="label">Clinical notes</label>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Diagnosis, advice, follow-up…"
          required
        />
      </div>
      <div>
        <label className="label">Medicines</label>
        <textarea
          className="input"
          rows={3}
          value={medicines}
          onChange={(e) => setMedicines(e.target.value)}
          placeholder="e.g. Paracetamol 500mg — twice daily for 3 days"
        />
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Save prescription"}
      </button>
    </form>
  );
}
