import { Router } from "express";
import { Slot } from "../models/Slot";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { slotSchema } from "../validation/schemas";
import { resolveDoctorByUser } from "../utils/resolveDoctor";

const router = Router();

// GET /api/slots/doctor/:doctorId -> active slots for a doctor (patient booking view)
router.get(
  "/doctor/:doctorId",
  authenticate,
  asyncHandler(async (req, res) => {
    const slots = await Slot.find({
      doctor: req.params.doctorId,
      isActive: true,
    }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json(slots);
  })
);

// GET /api/slots/mine -> the logged-in doctor's own slots
router.get(
  "/mine",
  authenticate,
  authorize("doctor"),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    const slots = await Slot.find({ doctor: doctor._id }).sort({
      dayOfWeek: 1,
      startTime: 1,
    });
    res.json(slots);
  })
);

// POST /api/slots -> doctor adds a slot
router.post(
  "/",
  authenticate,
  authorize("doctor"),
  validateBody(slotSchema),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    if (req.body.startTime >= req.body.endTime) {
      throw new ApiError(400, "startTime must be before endTime");
    }
    const slot = await Slot.create({ ...req.body, doctor: doctor._id });
    res.status(201).json(slot);
  })
);

// PATCH /api/slots/:id -> doctor edits own slot
router.patch(
  "/:id",
  authenticate,
  authorize("doctor"),
  validateBody(slotSchema.partial()),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    const slot = await Slot.findOne({ _id: req.params.id, doctor: doctor._id });
    if (!slot) throw new ApiError(404, "Slot not found");
    Object.assign(slot, req.body);
    if (slot.startTime >= slot.endTime) {
      throw new ApiError(400, "startTime must be before endTime");
    }
    await slot.save();
    res.json(slot);
  })
);

// DELETE /api/slots/:id -> doctor removes own slot
router.delete(
  "/:id",
  authenticate,
  authorize("doctor"),
  asyncHandler(async (req, res) => {
    const doctor = await resolveDoctorByUser(req.user!.id);
    const slot = await Slot.findOneAndDelete({
      _id: req.params.id,
      doctor: doctor._id,
    });
    if (!slot) throw new ApiError(404, "Slot not found");
    res.json({ message: "Slot removed" });
  })
);

export default router;
