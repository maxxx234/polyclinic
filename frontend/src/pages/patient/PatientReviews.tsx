import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Quote, Star } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Review } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Stars, StarInput } from "../../components/ui/Stars";
import { formatDateTime } from "../../lib/format";

export default function PatientReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [treatmentFor, setTreatmentFor] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get<Review[]>("/reviews");
      setReviews(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 5) {
      toast.error("Please write a few words about your experience.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/reviews", { rating, comment, treatmentFor: treatmentFor || undefined });
      toast.success("Thank you for your feedback!");
      setComment("");
      setTreatmentFor("");
      setRating(5);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Corner</h1>
        <p className="text-sm text-slate-500">Share your experience and read what others say.</p>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-700">
          <Star size={18} className="text-amber-400" /> Write a review
        </h3>
        <div>
          <label className="label">Your rating</label>
          <StarInput value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="label">Treatment / department <span className="text-slate-400">(optional)</span></label>
          <input
            className="input"
            value={treatmentFor}
            onChange={(e) => setTreatmentFor(e.target.value)}
            placeholder="e.g. Cardiology consultation"
          />
        </div>
        <div>
          <label className="label">Your experience</label>
          <textarea
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your visit…"
            required
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit review"}
        </button>
      </form>

      {loading ? (
        <SkeletonList rows={3} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={Quote} title="No reviews yet" message="Be the first to share your experience!" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r, i) => (
            <div
              key={r._id}
              className="card"
              style={{ animation: "var(--animate-slide-up)", animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">
                    {r.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    {r.treatmentFor && <p className="text-xs text-slate-400">{r.treatmentFor}</p>}
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="mt-3 text-sm text-slate-600">“{r.comment}”</p>
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
