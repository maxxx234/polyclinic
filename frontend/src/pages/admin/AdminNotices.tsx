import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Megaphone, Send, Trash2 } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Announcement } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { formatDateTime } from "../../lib/format";

export default function AdminNotices() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get<Announcement[]>("/announcements");
      setItems(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/announcements", { title, message });
      toast.success("Announcement posted");
      setTitle("");
      setMessage("");
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const ok = await confirm({ title: "Delete this announcement?", danger: true, confirmText: "Delete" });
    if (!ok) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notices &amp; Announcements</h1>
        <p className="text-sm text-slate-500">Broadcast updates to doctors and patients.</p>
      </div>

      <form onSubmit={post} className="card space-y-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday notice" required minLength={2} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement…" required minLength={2} />
        </div>
        <button className="btn-primary" disabled={busy}>
          <Send size={15} /> {busy ? "Posting…" : "Post announcement"}
        </button>
      </form>

      {loading ? (
        <SkeletonList rows={3} />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" message="Posted notices will appear here." />
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div
              key={a._id}
              className="card card-hover"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Megaphone size={18} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{a.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => remove(a._id)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
