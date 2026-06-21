import { Router } from "express";
import { Bill } from "../models/Bill";
import { Appointment } from "../models/Appointment";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { authenticate, authorize } from "../middleware/auth";
import { resolveDoctorByUser } from "../utils/resolveDoctor";

const router = Router();

// GET /api/bills/mine -> patient's bills (with appointment + doctor info)
router.get(
  "/mine",
  authenticate,
  authorize("patient"),
  asyncHandler(async (req, res) => {
    const appts = await Appointment.find({ patient: req.user!.id }).select("_id");
    const ids = appts.map((a) => a._id);
    const bills = await Bill.find({ appointment: { $in: ids } })
      .populate({
        path: "appointment",
        populate: [
          { path: "doctor", populate: { path: "user", select: "name" } },
          { path: "slot" },
        ],
      })
      .sort({ createdAt: -1 });
    res.json(bills);
  })
);

// GET /api/bills -> admin: all bills
router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const bills = await Bill.find()
      .populate({
        path: "appointment",
        populate: [
          { path: "patient", select: "name email" },
          { path: "doctor", populate: { path: "user", select: "name" } },
        ],
      })
      .sort({ createdAt: -1 });
    res.json(bills);
  })
);

// PATCH /api/bills/:id/pay -> patient pays their bill (mock payment)
router.patch(
  "/:id/pay",
  authenticate,
  asyncHandler(async (req, res) => {
    const bill = await Bill.findById(req.params.id).populate("appointment");
    if (!bill) throw new ApiError(404, "Bill not found");

    const appt = bill.appointment as unknown as { patient: { toString(): string } };
    const user = req.user!;
    if (user.role === "patient" && appt.patient.toString() !== user.id) {
      throw new ApiError(403, "Not your bill");
    }
    if (user.role === "doctor") {
      // doctors don't settle patient bills
      throw new ApiError(403, "Doctors cannot mark bills as paid");
    }
    if (bill.status === "paid") throw new ApiError(400, "Bill already paid");

    bill.status = "paid";
    bill.paidAt = new Date();
    await bill.save();
    res.json(bill);
  })
);

export default router;
