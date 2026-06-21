import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "blue" | "amber" | "violet" | "rose" | "slate";
  hint?: string;
  delay?: number;
}

const TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
  hint,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="card card-hover flex items-center gap-4"
      style={{ animation: "var(--animate-slide-up)", animationDelay: `${delay}ms` }}
    >
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
