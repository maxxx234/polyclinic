import { Schema, model, Document, Types } from "mongoose";
import { APPOINTMENT_STATUSES } from "../config/constants";

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  slot: Types.ObjectId;
  date: string; // "YYYY-MM-DD" calendar date the slot is booked for
  status: "Requested" | "Confirmed" | "Completed" | "Cancelled";
  reason?: string;
  /**
   * `active` is true while the appointment occupies its slot. It is set to
   * false when cancelled, which frees the slot for re-booking. Combined with
   * the partial unique index below, this is the database-level half of the
   * slot-conflict engine.
   */
  active: boolean;
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    slot: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "Requested",
    },
    reason: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Slot-conflict engine (DB-level): at most ONE active appointment may exist for
// a given doctor + slot + date. A concurrent double-booking triggers a duplicate
// key error (E11000) which the controller maps to HTTP 409. Cancelled
// appointments have active=false so the slot can be re-booked.
appointmentSchema.index(
  { doctor: 1, slot: 1, date: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);

// One-to-one virtuals so bill & prescription can be populated onto appointments.
appointmentSchema.virtual("bill", {
  ref: "Bill",
  localField: "_id",
  foreignField: "appointment",
  justOne: true,
});
appointmentSchema.virtual("prescription", {
  ref: "Prescription",
  localField: "_id",
  foreignField: "appointment",
  justOne: true,
});
appointmentSchema.set("toJSON", { virtuals: true });
appointmentSchema.set("toObject", { virtuals: true });

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema
);
