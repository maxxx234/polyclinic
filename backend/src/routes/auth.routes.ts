import { Router } from "express";
import { User } from "../models/User";
import { Doctor } from "../models/Doctor";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { validateBody } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { registerSchema, loginSchema } from "../validation/schemas";

const router = Router();

// POST /api/auth/register  (patients, or self-serve doctor signup)
router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      phone,
      age,
      gender,
      role,
      specialty,
      consultationFee,
      experience,
      qualification,
      languages,
      bio,
    } = req.body;

    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(409, "Email already registered");

    const finalRole = role === "doctor" ? "doctor" : "patient";
    if (finalRole === "doctor" && !specialty) {
      throw new ApiError(400, "Specialty is required to register as a doctor");
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      age,
      gender,
      role: finalRole,
    });

    if (finalRole === "doctor") {
      await Doctor.create({
        user: user._id,
        specialty,
        consultationFee: consultationFee ?? 500,
        experience: experience ?? 0,
        qualification,
        languages,
        bio,
      });
    }

    const token = signToken({ sub: user._id.toString(), role: user.role, name: user.name });
    res.status(201).json({ token, user });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, "Invalid email or password");

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid email or password");

    const token = signToken({ sub: user._id.toString(), role: user.role, name: user.name });
    res.json({ token, user });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, "User not found");

    let doctorProfile = null;
    if (user.role === "doctor") {
      doctorProfile = await Doctor.findOne({ user: user._id });
    }
    res.json({ user, doctorProfile });
  })
);

export default router;
