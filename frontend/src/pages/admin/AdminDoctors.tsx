import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Stethoscope, Mail, IndianRupee, Trash2, Users } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Doctor } from "../../api/types";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useConfirm } from "../../components/ui/ConfirmDialog";

const EMPTY = {
  name: "",
  email: "",
  password: "",
  phone: "",
  specialty: "",
  consultationFee: 500,
  experience: 0,
  qualification: "",
  languages: "",
  bio: "",
};

export default function AdminDoctors() {
  const confirm = useConfirm();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get<Doctor[]>("/doctors");
      setDoctors(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const languages = form.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      await api.post("/doctors", {
        ...form,
        consultationFee: Number(form.consultationFee),
        experience: Number(form.experience),
        languages,
      });
      toast.success("Doctor added");
      setForm({ ...EMPTY });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    const ok = await confirm({
      title: "Remove doctor?",
      message: `${name}'s account and profile will be deleted.`,
      danger: true,
      confirmText: "Remove",
    });
    if (!ok) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast.success("Doctor removed");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-sm text-slate-500">Manage your clinic's medical staff.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add doctor
        </button>
      </div>

      {loading ? (
        <SkeletonCards count={6} />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No doctors yet"
          message="Add your first doctor to start accepting appointments."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add doctor
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d, i) => (
            <div
              key={d._id}
              className="card card-hover"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white">
                    {d.user.name.replace(/^Dr\.?\s*/, "").charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{d.user.name}</p>
                    <p className="flex items-center gap-1 text-sm text-brand-600">
                      <Stethoscope size={13} /> {d.specialty}
                    </p>
                  </div>
                </div>
                <button
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => remove(d._id, d.user.name)}
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {d.qualification && (
                <p className="mt-2 truncate text-xs text-slate-400">{d.qualification}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                  {d.experience}+ yrs
                </span>
                <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <IndianRupee size={11} /> {d.consultationFee}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 truncate text-sm text-slate-500">
                <Mail size={13} /> {d.user.email}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add a new doctor"
        subtitle="Creates a login account and doctor profile."
        size="lg"
      >
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Specialty</label>
            <input className="input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Consultation fee (₹)</label>
            <input className="input" type="number" min={0} value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input className="input" type="number" min={0} max={70} value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Qualification</label>
            <input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="MBBS, MD" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Languages <span className="text-slate-400">(comma separated)</span></label>
            <input className="input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Hindi" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea className="input" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Creating…" : "Create doctor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
