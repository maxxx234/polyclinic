import { Schema, model, Document, Types } from "mongoose";

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  specialty: string;
  consultationFee: number;
  experience: number; // years of experience
  qualification?: string; // e.g. "MBBS, MD (Cardiology)"
  languages?: string[]; // languages spoken
  bio?: string;
}

const doctorSchema = new Schema<IDoctor>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  specialty: { type: String, required: true, trim: true, index: true },
  consultationFee: { type: Number, default: 500, min: 0 },
  experience: { type: Number, default: 0, min: 0 },
  qualification: { type: String, trim: true },
  languages: { type: [String], default: [] },
  bio: { type: String, trim: true },
});

export const Doctor = model<IDoctor>("Doctor", doctorSchema);
