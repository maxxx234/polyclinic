import {
  HeartPulse,
  Sparkles,
  Bone,
  Baby,
  Brain,
  Eye,
  Stethoscope,
  Smile,
  Ear,
  Flower2,
  HeartHandshake,
  Apple,
  Wind,
  Droplet,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface Speciality {
  name: string;
  icon: LucideIcon;
  description: string;
  tone: string;
}

export const SPECIALITIES: Speciality[] = [
  { name: "Cardiology", icon: HeartPulse, description: "Heart check-ups, ECG, angioplasty and complete cardiac care.", tone: "bg-rose-50 text-rose-600" },
  { name: "Dermatology", icon: Sparkles, description: "Skin, hair and cosmetology treatments including laser therapy.", tone: "bg-amber-50 text-amber-600" },
  { name: "Orthopedics", icon: Bone, description: "Joint replacement, fracture care and sports-injury rehab.", tone: "bg-blue-50 text-blue-600" },
  { name: "Pediatrics", icon: Baby, description: "Child health, growth monitoring and routine vaccinations.", tone: "bg-violet-50 text-violet-600" },
  { name: "Neurology", icon: Brain, description: "Care for migraine, epilepsy, stroke and nerve disorders.", tone: "bg-indigo-50 text-indigo-600" },
  { name: "Ophthalmology", icon: Eye, description: "Eye exams, cataract surgery and vision correction.", tone: "bg-cyan-50 text-cyan-600" },
  { name: "General Medicine", icon: Stethoscope, description: "Everyday illnesses, health screenings and preventive care.", tone: "bg-brand-50 text-brand-600" },
  { name: "Dentistry", icon: Smile, description: "Cleaning, fillings, root canals and cosmetic dentistry.", tone: "bg-teal-50 text-teal-600" },
  { name: "ENT", icon: Ear, description: "Ear, nose and throat care — sinus, hearing and voice.", tone: "bg-sky-50 text-sky-600" },
  { name: "Gynecology", icon: Flower2, description: "Women's health, prenatal care and gynecological wellness.", tone: "bg-pink-50 text-pink-600" },
  { name: "Psychiatry", icon: HeartHandshake, description: "Support for anxiety, depression, stress and sleep.", tone: "bg-fuchsia-50 text-fuchsia-600" },
  { name: "Gastroenterology", icon: Apple, description: "Digestive health — acidity, ulcers, liver and gut care.", tone: "bg-orange-50 text-orange-600" },
  { name: "Pulmonology", icon: Wind, description: "Asthma, breathing and respiratory-care specialists.", tone: "bg-emerald-50 text-emerald-600" },
  { name: "Urology", icon: Droplet, description: "Kidney stones, urinary and men's health treatment.", tone: "bg-blue-50 text-blue-600" },
  { name: "Endocrinology", icon: Activity, description: "Diabetes, thyroid and hormonal-balance management.", tone: "bg-purple-50 text-purple-600" },
];
