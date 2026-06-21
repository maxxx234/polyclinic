import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Megaphone } from "lucide-react";
import { api, apiError } from "../api/client";
import type { Announcement } from "../api/types";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDateTime } from "../lib/format";

export default function Notices() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements")
      .then((res) => setItems(res.data))
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonList rows={3} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notices &amp; Announcements</h1>
        <p className="text-sm text-slate-500">Latest updates from the clinic.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" message="Check back later for clinic updates." />
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div
              key={a._id}
              className="card card-hover"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Megaphone size={18} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                    <span className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                  <p className="mt-2 text-xs text-slate-400">Posted by {a.postedBy?.name ?? "Admin"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
