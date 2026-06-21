import { z } from "zod";
import { APPOINTMENT_STATUSES } from "../config/constants";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  // Phone is mandatory for patient registration.
  phone: z.string().min(10, "Enter a valid phone number").max(20),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  // Patients self-register. Doctor/admin accounts are created by an admin.
  role: z.enum(["patient", "doctor"]).optional(),
  // Required only when role === "doctor"
  specialty: z.string().min(2).max(80).optional(),
  consultationFee: z.number().min(0).max(100000).optional(),
  experience: z.number().int().min(0).max(70).optional(),
  qualification: z.string().max(200).optional(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  bio: z.string().max(1000).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDoctorSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().min(6).max(20).optional(),
  specialty: z.string().min(2).max(80),
  consultationFee: z.number().min(0).max(100000).default(500),
  experience: z.number().int().min(0).max(70).default(0),
  qualification: z.string().max(200).optional(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  bio: z.string().max(1000).optional(),
});

export const updateDoctorSchema = z.object({
  specialty: z.string().min(2).max(80).optional(),
  consultationFee: z.number().min(0).max(100000).optional(),
  experience: z.number().int().min(0).max(70).optional(),
  qualification: z.string().max(200).optional(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  bio: z.string().max(1000).optional(),
});

export const slotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Use HH:mm"),
  endTime: z.string().regex(timeRegex, "Use HH:mm"),
  isActive: z.boolean().optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  slotId: z.string().min(1),
  date: z.string().regex(dateRegex, "Use YYYY-MM-DD"),
  reason: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});

export const prescriptionSchema = z.object({
  notes: z.string().min(1).max(4000),
  medicines: z.string().max(4000).optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(2).max(120),
  message: z.string().min(2).max(2000),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
  treatmentFor: z.string().max(120).optional(),
});
