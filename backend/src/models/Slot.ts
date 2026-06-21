import { Schema, model, Document, Types } from "mongoose";

export interface ISlot extends Document {
  _id: Types.ObjectId;
  doctor: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  isActive: boolean;
}

const slotSchema = new Schema<ISlot>({
  doctor: {
    type: Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    index: true,
  },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export const Slot = model<ISlot>("Slot", slotSchema);
