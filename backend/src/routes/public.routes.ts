import { Router } from "express";
import { Doctor } from "../models/Doctor";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// These endpoints are PUBLIC (no auth) so the marketing landing page can show
// real doctors, specialties and patient testimonials before a visitor logs in.

// GET /api/public/doctors -> registered doctors for the landing showcase
router.get(
  "/doctors",
  asyncHandler(async (_req, res) => {
    const doctors = await Doctor.find()
      .populate("user", "name")
      .sort({ experience: -1 })
      .lean();
    res.json(doctors);
  })
);

// GET /api/public/specialties -> distinct specialties we treat
router.get(
  "/specialties",
  asyncHandler(async (_req, res) => {
    const specialties = await Doctor.distinct("specialty");
    res.json(specialties.sort());
  })
);

// GET /api/public/reviews -> patient testimonials
router.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(30).lean();
    res.json(reviews);
  })
);

// GET /api/public/stats -> headline numbers for the landing page
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [doctors, patients, specialties, reviews] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: "patient" }),
      Doctor.distinct("specialty"),
      Review.countDocuments(),
    ]);
    res.json({
      doctors,
      patients,
      specialties: specialties.length,
      reviews,
    });
  })
);

export default router;
