import { Types } from "mongoose";
import { Notification, NotificationType } from "../models/Notification";

interface NotifyData {
  type: NotificationType;
  title: string;
  message: string;
  appointment?: Types.ObjectId | string | null;
}

/** Creates a notification for a recipient. Never throws into the request flow. */
export async function notify(
  userId: Types.ObjectId | string,
  data: NotifyData
): Promise<void> {
  try {
    await Notification.create({
      user: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      appointment: data.appointment ?? null,
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
