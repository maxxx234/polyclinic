import { Schema, model, Document, Types } from "mongoose";
import { BILL_STATUSES } from "../config/constants";

export interface IBill extends Document {
  _id: Types.ObjectId;
  appointment: Types.ObjectId;
  amount: number;
  status: "unpaid" | "paid";
  invoiceNo: string;
  paidAt?: Date | null;
  createdAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BILL_STATUSES, default: "unpaid" },
    invoiceNo: { type: String, required: true, unique: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Bill = model<IBill>("Bill", billSchema);
