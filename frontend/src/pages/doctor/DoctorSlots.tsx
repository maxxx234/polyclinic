import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Clock, Trash2, Power } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Slot } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { DAYS } from "../../lib/format";

export default function DoctorSlots() {
  const confirm = useConfirm();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "09:30" });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get<Slot[]>("/slots/mine");
      setSlots(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/slots", {
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success("Slot added");
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(slot: Slot) {
    try {
      await api.patch(`/slots/${slot._id}`, { isActive: !slot.isActive });
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  async function remove(id: string) {
    const ok = await confirm({ title: "Delete this slot?", danger: true, confirmText: "Delete" });
    if (!ok) return;
    try {
      await api.delete(`/slots/${id}`);
      toast.success("Slot removed");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const byDay = DAYS.map((_, day) => ({
    day,
    slots: slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Availability Slots</h1>
        <p className="text-sm text-slate-500">Define the weekly time slots patients can book.</p>
      </div>

      <form onSubmit={add} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <label className="label">Day</label>
          <select
            className="select"
            value={form.dayOfWeek}
            onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start</label>
          <input
            className="input"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">End</label>
          <input
            className="input"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          <Plus size={16} /> {busy ? "Adding…" : "Add slot"}
        </button>
      </form>

      {loading ? (
        <SkeletonList rows={3} />
      ) : byDay.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No slots yet"
          message="Add your weekly availability using the form above."
        />
      ) : (
        <div className="space-y-4">
          {byDay.map((g) => (
            <div key={g.day} className="card">
              <h3 className="mb-3 text-sm font-bold text-slate-700">{DAYS[g.day]}</h3>
              <div className="flex flex-wrap gap-2">
                {g.slots.map((s) => (
                  <div
                    key={s._id}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
                      s.isActive
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <Clock size={14} className={s.isActive ? "text-brand-500" : "text-slate-300"} />
                    <span className="font-semibold">{s.startTime}–{s.endTime}</span>
                    <button
                      onClick={() => toggle(s)}
                      className="text-slate-400 transition hover:text-brand-600"
                      title={s.isActive ? "Disable" : "Enable"}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      onClick={() => remove(s._id)}
                      className="text-slate-400 transition hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
