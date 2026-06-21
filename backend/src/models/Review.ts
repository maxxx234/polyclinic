import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  patient?: Types.ObjectId | null;
  name: string; // display name
  rating: number; // 1..5
  comment: string;
  treatmentFor?: string; // e.g. "Cardiology consultation"
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    treatmentFor: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Review = model<IReview>("Review", reviewSchema);
