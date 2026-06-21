import { Router } from "express";
import { Prescription } from "../models/Prescription";
import { Appointment } from "../models/Appointment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prescriptionSchema } from "../validation/schemas";
import { resolveDoctorByUser } from "../utils/resolveDoctor";

const router = Router();

// POST /api/prescriptions/appointment/:appointmentId
//   -> the treating doctor adds/updates a prescription for an appointment
router.post(
  "/appointment/:appointmentId",
  authenticate,
  authorize("doctor"),
  validateBody(prescriptionSchema),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) throw new ApiError(404, "Appointment not found");
    if (appt.doctor.toString() !== doctor._id.toString()) {
      throw new ApiError(403, "Not your appointment");
    }

    const { notes, medicines } = req.body;
    const prescription = await Prescription.findOneAndUpdate(
      { appointment: appt._id },
      { notes, medicines: medicines ?? "", appointment: appt._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(prescription);
  })
);

// GET /api/prescriptions/appointment/:appointmentId
//   -> owner patient, treating doctor, or admin
router.get(
  "/appointment/:appointmentId",
  authenticate,
  asyncHandler(async (req, res) => {
    const appt = await Appointment.findById(req.params.appointmentId);
    if (!appt) throw new ApiError(404, "Appointment not found");

    const user = req.user!;
    let allowed = user.role === "admin" || appt.patient.toString() === user.id;
    if (!allowed && user.role === "doctor") {
      const doctor = await resolveDoctorByUser(user.id);
      allowed = appt.doctor.toString() === doctor._id.toString();
    }
    if (!allowed) throw new ApiError(403, "You cannot view this prescription");

    const prescription = await Prescription.findOne({ appointment: appt._id });
    if (!prescription) throw new ApiError(404, "No prescription for this appointment");
    res.json(prescription);
  })
);

export default router;
