import { Schema, model, Document, Types } from "mongoose";

export interface IAnnouncement extends Document {
  _id: Types.ObjectId;
  title: string;
  message: string;
  postedBy: Types.ObjectId;
  createdAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Announcement = model<IAnnouncement>(
  "Announcement",
  announcementSchema
);
