import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "request"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "reminder";

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId; // recipient
  type: NotificationType;
  title: string;
  message: string;
  appointment?: Types.ObjectId | null;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment", default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>("Notification", notificationSchema);
