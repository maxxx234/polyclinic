import { Router } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) /
      86400000
  );
}

// GET /api/admin/patients -> patient records with visit stats + follow-up status
router.get(
  "/patients",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const today = todayStr();

    const [patients, appts, bills] = await Promise.all([
      User.find({ role: "patient" }).lean(),
      Appointment.find().lean(),
      Bill.find().lean(),
    ]);

    // Map appointmentId -> unpaid amount
    const unpaidByAppt = new Map<string, number>();
    bills.forEach((b) => {
      if (b.status === "unpaid") unpaidByAppt.set(String(b.appointment), b.amount);
    });

    const records = patients.map((p) => {
      const mine = appts.filter((a) => String(a.patient) === String(p._id));
      const completed = mine.filter((a) => a.status === "Completed");
      const lastVisit =
        completed.length > 0
          ? completed.map((a) => a.date).sort().reverse()[0]
          : null;
      const upcoming = mine
        .filter((a) => ["Requested", "Confirmed"].includes(a.status) && a.date >= today)
        .map((a) => a.date)
        .sort()[0] ?? null;
      const dues = mine.reduce(
        (sum, a) => sum + (unpaidByAppt.get(String(a._id)) ?? 0),
        0
      );

      let followUp: "new" | "due" | "active" = "active";
      if (completed.length === 0) followUp = "new";
      else if (lastVisit && daysBetween(lastVisit, today) > 90) followUp = "due";

      return {
        _id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone ?? null,
        age: p.age ?? null,
        gender: p.gender ?? null,
        totalAppointments: mine.length,
        totalVisits: completed.length,
        lastVisit,
        upcoming,
        dues,
        followUp,
      };
    });

    // Sort: due first, then new, then active; newest activity up top.
    const order = { due: 0, new: 1, active: 2 } as const;
    records.sort((a, b) => order[a.followUp] - order[b.followUp]);

    const summary = {
      total: records.length,
      due: records.filter((r) => r.followUp === "due").length,
      newPatients: records.filter((r) => r.followUp === "new").length,
      active: records.filter((r) => r.followUp === "active").length,
    };

    res.json({ summary, records });
  })
);

export default router;
