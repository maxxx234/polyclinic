export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-600" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}
