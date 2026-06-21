import { Router } from "express";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { User } from "../models/User";
import { Doctor } from "../models/Doctor";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/dashboard -> admin analytics
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const today = todayStr();

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsToday,
      statusAgg,
      revenueAgg,
      pendingRevenueAgg,
      specialtyAgg,
      recent,
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today, status: { $ne: "Cancelled" } }),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Bill.aggregate([
        { $match: { status: "unpaid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Appointment.aggregate([
        {
          $lookup: {
            from: "doctors",
            localField: "doctor",
            foreignField: "_id",
            as: "doc",
          },
        },
        { $unwind: "$doc" },
        { $group: { _id: "$doc.specialty", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Appointment.find()
        .populate([
          { path: "patient", select: "name" },
          { path: "doctor", populate: { path: "user", select: "name" } },
          { path: "slot" },
        ])
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const statusBreakdown: Record<string, number> = {
      Requested: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0,
    };
    statusAgg.forEach((s: { _id: string; count: number }) => {
      statusBreakdown[s._id] = s.count;
    });

    res.json({
      totals: {
        patients: totalPatients,
        doctors: totalDoctors,
        appointments: totalAppointments,
        appointmentsToday,
        revenue: revenueAgg[0]?.total ?? 0,
        pendingRevenue: pendingRevenueAgg[0]?.total ?? 0,
      },
      statusBreakdown,
      topSpecialties: specialtyAgg.map((s: { _id: string; count: number }) => ({
        specialty: s._id,
        count: s.count,
      })),
      recentAppointments: recent,
    });
  })
);

export default router;
