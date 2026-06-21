import { Router } from "express";
import { Notification } from "../models/Notification";
import { Appointment } from "../models/Appointment";
import { Doctor } from "../models/Doctor";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middleware/auth";

const router = Router();

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function fmtDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// GET /api/notifications -> stored notifications + dynamic reminders + unread count
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const [stored, unreadCount] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(40).lean(),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    // Build dynamic reminders for appointments happening today / tomorrow.
    const today = isoDate(0);
    const tomorrow = isoDate(1);
    let reminders: Array<Record<string, unknown>> = [];

    if (req.user!.role === "patient") {
      const upcoming = await Appointment.find({
        patient: userId,
        status: "Confirmed",
        date: { $in: [today, tomorrow] },
      })
        .populate({ path: "doctor", populate: { path: "user", select: "name" } })
        .lean();
      reminders = upcoming.map((a) => ({
        _id: `reminder-${a._id}`,
        type: "reminder",
        title: "Upcoming appointment",
        message: `Reminder: appointment with ${(a.doctor as { user?: { name?: string } })?.user?.name ?? "your doctor"} on ${fmtDate(a.date as string)}.`,
        read: true,
        reminder: true,
        createdAt: new Date(),
      }));
    } else if (req.user!.role === "doctor") {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor) {
        const upcoming = await Appointment.find({
          doctor: doctor._id,
          status: { $in: ["Requested", "Confirmed"] },
          date: { $in: [today, tomorrow] },
        })
          .populate({ path: "patient", select: "name" })
          .lean();
        reminders = upcoming.map((a) => ({
          _id: `reminder-${a._id}`,
          type: "reminder",
          title: "Upcoming appointment",
          message: `Reminder: ${(a.patient as { name?: string })?.name ?? "a patient"} on ${fmtDate(a.date as string)} (${a.status}).`,
          read: true,
          reminder: true,
          createdAt: new Date(),
        }));
      }
    }

    res.json({ items: [...reminders, ...stored], unreadCount });
  })
);

// PATCH /api/notifications/read-all -> mark all as read
router.patch(
  "/read-all",
  authenticate,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user!.id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked read" });
  })
);

export default router;
