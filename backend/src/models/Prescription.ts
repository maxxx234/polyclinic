import { Schema, model, Document, Types } from "mongoose";

export interface IPrescription extends Document {
  _id: Types.ObjectId;
  appointment: Types.ObjectId;
  notes: string;
  medicines: string;
  createdAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    notes: { type: String, required: true },
    medicines: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Prescription = model<IPrescription>(
  "Prescription",
  prescriptionSchema
);
