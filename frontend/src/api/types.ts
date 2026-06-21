export type Role = "admin" | "doctor" | "patient";

export type AppointmentStatus =
  | "Requested"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  createdAt?: string;
}

export type NotificationType =
  | "request"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "reminder";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  reminder?: boolean;
  createdAt: string;
}

export interface Doctor {
  _id: string;
  user: User;
  specialty: string;
  consultationFee: number;
  experience: number;
  qualification?: string;
  languages?: string[];
  bio?: string;
}

export interface Slot {
  _id: string;
  doctor: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Bill {
  _id: string;
  appointment: string | Appointment;
  amount: number;
  status: "unpaid" | "paid";
  invoiceNo: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface Prescription {
  _id: string;
  appointment: string;
  notes: string;
  medicines: string;
  createdAt: string;
}

export interface Appointment {
  _id: string;
  patient: User;
  doctor: Doctor;
  slot: Slot;
  date: string;
  status: AppointmentStatus;
  reason?: string;
  active: boolean;
  createdAt: string;
  bill?: Bill | null;
  prescription?: Prescription | null;
}

export interface Review {
  _id: string;
  patient?: string | null;
  name: string;
  rating: number;
  comment: string;
  treatmentFor?: string;
  createdAt: string;
}

export interface RecommendedDoctor {
  _id: string;
  specialty: string;
  experience: number;
  consultationFee: number;
  qualification?: string;
  user: { _id?: string; name: string };
}

export interface SymptomResult {
  specialty: string;
  possibleConditions: string[];
  urgency: "low" | "medium" | "high";
  advice: string;
  disclaimer: string;
  doctors: RecommendedDoctor[];
}

export interface HealthRecommendation {
  type: "checkup" | "screening" | "payment" | "upcoming" | "wellness" | "first";
  title: string;
  message: string;
  action?: "book" | "bills";
}

export interface PatientOverview {
  name: string;
  age: number | null;
  gender: string | null;
  stats: {
    totalVisits: number;
    totalAppointments: number;
    dues: number;
    lastVisit: { date: string; doctor: string | null } | null;
    nextAppointment: { date: string; doctor: string | null; status: string } | null;
  };
  recommendations: HealthRecommendation[];
}

export interface AdminPatient {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  totalAppointments: number;
  totalVisits: number;
  lastVisit: string | null;
  upcoming: string | null;
  dues: number;
  followUp: "new" | "due" | "active";
}

export interface AdminPatientsResponse {
  summary: { total: number; due: number; newPatients: number; active: number };
  records: AdminPatient[];
}

export interface DashboardInsights {
  summary: string;
  recommendations: string[];
  generatedAt: string;
}

export interface PublicStats {
  doctors: number;
  patients: number;
  specialties: number;
  reviews: number;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  postedBy: { _id: string; name: string; role: Role };
  createdAt: string;
}

export interface DashboardData {
  totals: {
    patients: number;
    doctors: number;
    appointments: number;
    appointmentsToday: number;
    revenue: number;
    pendingRevenue: number;
  };
  statusBreakdown: Record<AppointmentStatus, number>;
  topSpecialties: { specialty: string; count: number }[];
  recentAppointments: Appointment[];
}
