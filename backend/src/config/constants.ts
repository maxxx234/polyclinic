export const ROLES = ["admin", "doctor", "patient"] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const BILL_STATUSES = ["unpaid", "paid"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
