import { Router } from "express";
import { Doctor } from "../models/Doctor";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { createDoctorSchema, updateDoctorSchema } from "../validation/schemas";

const router = Router();

// GET /api/doctors  -> list all doctors (any authenticated user can browse)
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { specialty, q } = req.query as { specialty?: string; q?: string };
    const filter: Record<string, unknown> = {};
    if (specialty) filter.specialty = specialty;

    let doctors = await Doctor.find(filter).populate("user", "name email phone").lean();

    if (q) {
      const term = q.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.specialty.toLowerCase().includes(term) ||
          (d.user as unknown as { name?: string })?.name?.toLowerCase().includes(term)
      );
    }
    res.json(doctors);
  })
);

// GET /api/doctors/specialties -> distinct specialty list (for filters)
router.get(
  "/specialties",
  authenticate,
  asyncHandler(async (_req, res) => {
    const specialties = await Doctor.distinct("specialty");
    res.json(specialties.sort());
  })
);

// GET /api/doctors/:id
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name email phone"
    );
    if (!doctor) throw new ApiError(404, "Doctor not found");
    res.json(doctor);
  })
);

// POST /api/doctors  -> admin creates a doctor (user + doctor profile)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(createDoctorSchema),
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      phone,
      specialty,
      consultationFee,
      experience,
      qualification,
      languages,
      bio,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(409, "Email already registered");

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: "doctor",
    });
    const doctor = await Doctor.create({
      user: user._id,
      specialty,
      consultationFee,
      experience,
      qualification,
      languages,
      bio,
    });
    const populated = await doctor.populate("user", "name email phone");
    res.status(201).json(populated);
  })
);

// PATCH /api/doctors/:id -> admin updates a doctor's profile
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateBody(updateDoctorSchema),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("user", "name email phone");
    if (!doctor) throw new ApiError(404, "Doctor not found");
    res.json(doctor);
  })
);

// DELETE /api/doctors/:id -> admin removes a doctor (and the linked user)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new ApiError(404, "Doctor not found");
    await User.findByIdAndDelete(doctor.user);
    await doctor.deleteOne();
    res.json({ message: "Doctor removed" });
  })
);

export default router;
