import { Router } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
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

interface Recommendation {
  type: "checkup" | "screening" | "payment" | "upcoming" | "wellness" | "first";
  title: string;
  message: string;
  action?: "book" | "bills";
}

// GET /api/patient/overview -> personal snapshot + health recommendations
router.get(
  "/overview",
  authenticate,
  authorize("patient"),
  asyncHandler(async (req, res) => {
    const today = todayStr();
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw new ApiError(404, "User not found");

    const appts = await Appointment.find({ patient: user._id })
      .populate({ path: "doctor", populate: { path: "user", select: "name" } })
      .lean();

    const completed = appts.filter((a) => a.status === "Completed");
    const lastCompleted = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
    const nextAppt = appts
      .filter((a) => ["Requested", "Confirmed"].includes(a.status) && a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    // Dues
    const apptIds = appts.map((a) => a._id);
    const unpaid = await Bill.find({ appointment: { $in: apptIds }, status: "unpaid" }).lean();
    const dues = unpaid.reduce((s, b) => s + b.amount, 0);

    // ---- Recommendations (rule-based, personalised) ----
    const recs: Recommendation[] = [];

    if (completed.length === 0) {
      recs.push({
        type: "first",
        title: "Start with a general check-up",
        message: "Book your first consultation to establish your health baseline.",
        action: "book",
      });
    } else if (lastCompleted && daysBetween(lastCompleted.date, today) > 90) {
      const months = Math.floor(daysBetween(lastCompleted.date, today) / 30);
      recs.push({
        type: "checkup",
        title: "Time for a regular check-up",
        message: `It's been about ${months} months since your last visit. A routine check-up keeps you on track.`,
        action: "book",
      });
    }

    const age = user.age ?? 0;
    if (age >= 60) {
      recs.push({
        type: "screening",
        title: "Senior wellness screening",
        message: "An annual senior health screening is recommended for your age group.",
        action: "book",
      });
    } else if (age >= 40) {
      recs.push({
        type: "screening",
        title: "Annual health screening",
        message: "A yearly full-body screening helps catch issues early after 40.",
        action: "book",
      });
    } else if (age > 0 && age <= 12) {
      recs.push({
        type: "screening",
        title: "Pediatric check-up",
        message: "Regular pediatric visits support healthy growth and timely vaccinations.",
        action: "book",
      });
    }

    if (dues > 0) {
      recs.push({
        type: "payment",
        title: "Pending bill",
        message: `You have ₹${dues} due. Settle it from the Bills tab.`,
        action: "bills",
      });
    }

    if (nextAppt) {
      const docName = (nextAppt.doctor as { user?: { name?: string } })?.user?.name ?? "your doctor";
      recs.push({
        type: "upcoming",
        title: "Upcoming appointment",
        message: `You have an appointment with ${docName} on ${nextAppt.date}.`,
      });
    }

    recs.push({
      type: "wellness",
      title: "Daily wellness",
      message: "Stay hydrated, sleep 7-8 hours and get 30 minutes of activity each day.",
    });

    res.json({
      name: user.name,
      age: user.age ?? null,
      gender: user.gender ?? null,
      stats: {
        totalVisits: completed.length,
        totalAppointments: appts.length,
        dues,
        lastVisit: lastCompleted
          ? {
              date: lastCompleted.date,
              doctor: (lastCompleted.doctor as { user?: { name?: string } })?.user?.name ?? null,
            }
          : null,
        nextAppointment: nextAppt
          ? {
              date: nextAppt.date,
              doctor: (nextAppt.doctor as { user?: { name?: string } })?.user?.name ?? null,
              status: nextAppt.status,
            }
          : null,
      },
      recommendations: recs,
    });
  })
);

export default router;
