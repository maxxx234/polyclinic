import type { AppointmentStatus } from "../api/types";

const STYLES: Record<AppointmentStatus, { cls: string; dot: string }> = {
  Requested: { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500" },
  Confirmed: { cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500" },
  Completed: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", dot: "bg-rose-500" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STYLES[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
