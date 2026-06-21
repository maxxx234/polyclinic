import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Receipt, CreditCard, CheckCircle2 } from "lucide-react";
import { api, apiError } from "../../api/client";
import type { Bill, Appointment } from "../../api/types";
import { SkeletonList } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDate, inr } from "../../lib/format";

export default function MyBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState("");

  async function load() {
    try {
      const res = await api.get<Bill[]>("/bills/mine");
      setBills(res.data);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(id: string) {
    setPayingId(id);
    try {
      await api.patch(`/bills/${id}/pay`);
      toast.success("Payment successful!");
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setPayingId("");
    }
  }

  if (loading) return <SkeletonList rows={3} />;

  const totalDue = bills
    .filter((b) => b.status === "unpaid")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bills &amp; Invoices</h1>
        <p className="text-sm text-slate-500">View and settle your consultation charges.</p>
      </div>

      {bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills yet"
          message="Bills are generated when a doctor completes your visit."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center justify-between border-amber-100 bg-amber-50/50">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Total due</p>
                <p className="text-2xl font-bold text-amber-700">{inr(totalDue)}</p>
              </div>
              <CreditCard className="text-amber-400" size={32} />
            </div>
            <div className="card flex items-center justify-between border-emerald-100 bg-emerald-50/50">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Total paid</p>
                <p className="text-2xl font-bold text-emerald-700">{inr(totalPaid)}</p>
              </div>
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => {
                  const appt = b.appointment as Appointment;
                  return (
                    <tr key={b._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{b.invoiceNo}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {appt?.doctor?.user?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {appt?.date ? formatDate(appt.date) : "—"}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{inr(b.amount)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`badge ${
                            b.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {b.status === "unpaid" && (
                          <button
                            className="btn-primary btn-sm"
                            disabled={payingId === b._id}
                            onClick={() => pay(b._id)}
                          >
                            <CreditCard size={14} />
                            {payingId === b._id ? "Paying…" : "Pay now"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
