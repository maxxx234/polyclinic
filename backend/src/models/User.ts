import { Schema, model, Document, Types } from "mongoose";
import { ROLES } from "../config/constants";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "doctor" | "patient";
  phone?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "patient", index: true },
    phone: { type: String, trim: true },
    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Never leak the password hash in JSON responses.
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete (ret as unknown as Record<string, unknown>).passwordHash;
    return ret;
  },
});

export const User = model<IUser>("User", userSchema);
