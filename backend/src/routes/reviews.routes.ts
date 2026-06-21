import { Router } from "express";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { reviewSchema } from "../validation/schemas";

const router = Router();

// GET /api/reviews -> all reviews (any authenticated user)
router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    res.json(reviews);
  })
);

// GET /api/reviews/mine -> the patient's own reviews
router.get(
  "/mine",
  authenticate,
  authorize("patient"),
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ patient: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(reviews);
  })
);

// POST /api/reviews -> a patient shares their experience
router.post(
  "/",
  authenticate,
  authorize("patient"),
  validateBody(reviewSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new ApiError(404, "User not found");

    const review = await Review.create({
      patient: user._id,
      name: user.name,
      rating: req.body.rating,
      comment: req.body.comment,
      treatmentFor: req.body.treatmentFor,
    });
    res.status(201).json(review);
  })
);

export default router;
