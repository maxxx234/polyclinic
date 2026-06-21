import { Router } from "express";
import { Appointment } from "../models/Appointment";
import { Slot } from "../models/Slot";
import { Doctor } from "../models/Doctor";
import { Bill } from "../models/Bill";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../validation/schemas";
import { resolveDoctorByUser } from "../utils/resolveDoctor";
import { notify } from "../utils/notify";

const router = Router();

function fmtDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const POPULATE = [
  { path: "doctor", populate: { path: "user", select: "name email phone" } },
  { path: "patient", select: "name email phone" },
  { path: "slot" },
  { path: "bill" },
  { path: "prescription" },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateInvoiceNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `INV-${ts}-${rnd}`;
}

// Re-query with bill, prescription, doctor, patient & slot populated.
async function loadPopulated(id: string) {
  return Appointment.findById(id).populate(POPULATE);
}

// ---------------------------------------------------------------------------
// POST /api/appointments  -> patient books an appointment (SLOT-CONFLICT ENGINE)
// ---------------------------------------------------------------------------
router.post(
  "/",
  authenticate,
  authorize("patient"),
  validateBody(bookAppointmentSchema),
  asyncHandler(async (req, res) => {
    const { doctorId, slotId, date, reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new ApiError(404, "Doctor not found");

    const slot = await Slot.findOne({
      _id: slotId,
      doctor: doctorId,
      isActive: true,
    });
    if (!slot) throw new ApiError(400, "Selected slot is unavailable for this doctor");

    // The calendar date must fall on the slot's weekday.
    const weekday = new Date(`${date}T00:00:00`).getDay();
    if (weekday !== slot.dayOfWeek) {
      throw new ApiError(400, "The chosen date does not match this slot's weekday");
    }
    if (date < todayStr()) {
      throw new ApiError(400, "Cannot book an appointment in the past");
    }

    try {
      const appt = await Appointment.create({
        patient: req.user!.id,
        doctor: doctorId,
        slot: slotId,
        date,
        reason,
        status: "Requested",
        active: true,
      });
      // Notify the doctor of the new appointment request.
      await notify(doctor.user, {
        type: "request",
        title: "New appointment request",
        message: `${req.user!.name} requested an appointment on ${fmtDate(date)}.`,
        appointment: appt._id,
      });

      const populated = await loadPopulated(appt._id.toString());
      res.status(201).json(populated);
    } catch (err) {
      // Partial unique index on (doctor, slot, date, active:true) -> duplicate.
      if ((err as { code?: number }).code === 11000) {
        throw new ApiError(409, "That slot is already booked for the selected date");
      }
      throw err;
    }
  })
);

// GET /api/appointments/mine -> patient's own appointments
router.get(
  "/mine",
  authenticate,
  authorize("patient"),
  asyncHandler(async (req, res) => {
    const appts = await Appointment.find({ patient: req.user!.id })
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 });
    res.json(appts);
  })
);

// GET /api/appointments/doctor -> the logged-in doctor's appointments
router.get(
  "/doctor",
  authenticate,
  authorize("doctor"),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    const { status, date } = req.query as { status?: string; date?: string };
    const filter: Record<string, unknown> = { doctor: doctor._id };
    if (status) filter.status = status;
    if (date) filter.date = date;

    const appts = await Appointment.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 });
    res.json(appts);
  })
);

// GET /api/appointments -> admin: all appointments
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { status, date } = req.query as { status?: string; date?: string };
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (date) filter.date = date;

    const appts = await Appointment.find(filter)
      .populate(POPULATE)
      .sort({ date: -1, createdAt: -1 });
    res.json(appts);
  })
);

// GET /api/appointments/:id -> owner patient, the doctor, or admin
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const appt = await Appointment.findById(req.params.id).populate(POPULATE);
    if (!appt) throw new ApiError(404, "Appointment not found");

    const user = req.user!;
    const isOwnerPatient = appt.patient && (appt.patient as { _id: { toString(): string } })._id.toString() === user.id;
    let isOwnerDoctor = false;
    if (user.role === "doctor") {
      const doctor = await resolveDoctorByUser(user.id);
      isOwnerDoctor = (appt.doctor as { _id: { toString(): string } })._id.toString() === doctor._id.toString();
    }
    if (user.role !== "admin" && !isOwnerPatient && !isOwnerDoctor) {
      throw new ApiError(403, "You cannot view this appointment");
    }
    res.json(appt);
  })
);

// ---------------------------------------------------------------------------
// PATCH /api/appointments/:id/status -> move through the lifecycle
//   Requested -> Confirmed -> Completed | Cancelled
// ---------------------------------------------------------------------------
router.patch(
  "/:id/status",
  authenticate,
  validateBody(updateAppointmentStatusSchema),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: string };
    const appt = await Appointment.findById(req.params.id);
    if (!appt) throw new ApiError(404, "Appointment not found");

    const user = req.user!;
    const isOwnerPatient = appt.patient.toString() === user.id;
    let isOwnerDoctor = false;
    if (user.role === "doctor") {
      const doctor = await resolveDoctorByUser(user.id);
      isOwnerDoctor = appt.doctor.toString() === doctor._id.toString();
    }

    // Permission rules per role.
    if (user.role === "patient") {
      if (!isOwnerPatient) throw new ApiError(403, "Not your appointment");
      if (status !== "Cancelled") {
        throw new ApiError(403, "Patients can only cancel appointments");
      }
    } else if (user.role === "doctor") {
      if (!isOwnerDoctor) throw new ApiError(403, "Not your appointment");
    } // admin: no extra restriction

    if (appt.status === "Completed") {
      throw new ApiError(400, "A completed appointment cannot change status");
    }
    if (appt.status === "Cancelled") {
      throw new ApiError(400, "A cancelled appointment cannot change status");
    }

    appt.status = status as typeof appt.status;
    // Free the slot for re-booking when cancelled.
    appt.active = status !== "Cancelled";
    await appt.save();

    // Load doctor (with name) for billing + notification messages.
    const doctor = await Doctor.findById(appt.doctor).populate("user", "name");
    const doctorName = (doctor?.user as unknown as { name?: string })?.name ?? "your doctor";

    // Auto-generate a consultation bill on completion.
    if (status === "Completed") {
      const existing = await Bill.findOne({ appointment: appt._id });
      if (!existing) {
        await Bill.create({
          appointment: appt._id,
          amount: doctor?.consultationFee ?? 500,
          status: "unpaid",
          invoiceNo: generateInvoiceNo(),
        });
      }
    }

    // Notifications per transition.
    if (status === "Confirmed") {
      await notify(appt.patient, {
        type: "confirmed",
        title: "Appointment confirmed",
        message: `Your appointment with ${doctorName} on ${fmtDate(appt.date)} is confirmed.`,
        appointment: appt._id,
      });
    } else if (status === "Completed") {
      await notify(appt.patient, {
        type: "completed",
        title: "Visit completed",
        message: `Your visit with ${doctorName} is complete. Your bill is now available.`,
        appointment: appt._id,
      });
    } else if (status === "Cancelled") {
      // Notify the other party.
      if (user.role === "patient" && doctor) {
        await notify(doctor.user, {
          type: "cancelled",
          title: "Appointment cancelled",
          message: `${user.name} cancelled their appointment on ${fmtDate(appt.date)}.`,
          appointment: appt._id,
        });
      } else {
        await notify(appt.patient, {
          type: "cancelled",
          title: "Appointment cancelled",
          message: `Your appointment with ${doctorName} on ${fmtDate(appt.date)} was cancelled.`,
          appointment: appt._id,
        });
      }
    }

    const populated = await loadPopulated(appt._id.toString());
    res.json(populated);
  })
);

export default router;
