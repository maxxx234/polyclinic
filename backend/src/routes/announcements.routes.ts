import { Router } from "express";
import { Announcement } from "../models/Announcement";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { announcementSchema } from "../validation/schemas";

const router = Router();

// GET /api/announcements -> any authenticated user sees notices
router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const items = await Announcement.find()
      .populate("postedBy", "name role")
      .sort({ createdAt: -1 });
    res.json(items);
  })
);

// POST /api/announcements -> admin posts a notice
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(announcementSchema),
  asyncHandler(async (req, res) => {
    const item = await Announcement.create({
      ...req.body,
      postedBy: req.user!.id,
    });
    const populated = await item.populate("postedBy", "name role");
    res.status(201).json(populated);
  })
);

// DELETE /api/announcements/:id -> admin removes a notice
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, "Announcement not found");
    res.json({ message: "Announcement removed" });
  })
);

export default router;
