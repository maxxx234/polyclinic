import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./config/db";
import { User } from "./models/User";
import { Doctor } from "./models/Doctor";
import { Slot } from "./models/Slot";
import { Appointment } from "./models/Appointment";
import { Bill } from "./models/Bill";
import { Prescription } from "./models/Prescription";
import { Announcement } from "./models/Announcement";
import { Review } from "./models/Review";
import { hashPassword } from "./utils/password";
import { env } from "./config/env";

/** Next calendar date (YYYY-MM-DD) on/after today that falls on `dayOfWeek`. */
function nextDateForWeekday(dayOfWeek: number): string {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

interface SeedResult {
  created: boolean;
}

/**
 * Populates the database with demo data. If `force` is false it only seeds when
 * the database is empty (used for auto-seed on server start). If `force` is true
 * it wipes and reseeds (used by the standalone `npm run seed` for a real DB).
 */
export async function seedDatabase(force = false): Promise<SeedResult> {
  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    return { created: false };
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Slot.deleteMany({}),
      Appointment.deleteMany({}),
      Bill.deleteMany({}),
      Prescription.deleteMany({}),
      Announcement.deleteMany({}),
      Review.deleteMany({}),
    ]);
  }

  const pw = {
    admin: await hashPassword(env.SEED_ADMIN_PASSWORD),
    doctor: await hashPassword("Doctor@123"),
    patient: await hashPassword("Patient@123"),
  };

  // --- Admin (credentials come from env so production can override) ---
  const admin = await User.create({
    name: "Clinic Admin",
    email: env.SEED_ADMIN_EMAIL,
    passwordHash: pw.admin,
    role: "admin",
    phone: "9000000001",
  });

  // --- Doctors (user + profile + slots) ---
  const doctorSeeds = [
    {
      name: "Dr. Arjun Mehta",
      email: "arjun@clinic.com",
      specialty: "Cardiology",
      fee: 800,
      experience: 12,
      qualification: "MBBS, MD (Cardiology), DM",
      languages: ["English", "Hindi"],
      bio: "Senior interventional cardiologist specialising in angioplasty and heart-failure management. Passionate about preventive cardiac care.",
      days: [1, 3, 5], // Mon, Wed, Fri
    },
    {
      name: "Dr. Priya Nair",
      email: "priya@clinic.com",
      specialty: "Dermatology",
      fee: 600,
      experience: 8,
      qualification: "MBBS, MD (Dermatology)",
      languages: ["English", "Hindi", "Malayalam"],
      bio: "Skin, hair and cosmetology specialist with a focus on acne, pigmentation and laser treatments.",
      days: [2, 4], // Tue, Thu
    },
    {
      name: "Dr. Rohit Sharma",
      email: "rohit@clinic.com",
      specialty: "Orthopedics",
      fee: 700,
      experience: 15,
      qualification: "MBBS, MS (Orthopedics)",
      languages: ["English", "Hindi", "Punjabi"],
      bio: "Joint replacement and sports-injury expert with 15 years treating athletes and arthritis patients.",
      days: [1, 4, 6], // Mon, Thu, Sat
    },
    {
      name: "Dr. Sneha Iyer",
      email: "sneha@clinic.com",
      specialty: "Pediatrics",
      fee: 500,
      experience: 6,
      qualification: "MBBS, DCH, MD (Pediatrics)",
      languages: ["English", "Hindi", "Tamil"],
      bio: "Child-health and vaccination specialist who makes every young patient feel at ease.",
      days: [2, 5], // Tue, Fri
    },
    {
      name: "Dr. Kavya Reddy",
      email: "kavya@clinic.com",
      specialty: "Neurology",
      fee: 900,
      experience: 11,
      qualification: "MBBS, MD, DM (Neurology)",
      languages: ["English", "Hindi", "Telugu"],
      bio: "Treats migraine, epilepsy, stroke and nerve disorders with a patient-first approach.",
      days: [1, 3, 5],
    },
    {
      name: "Dr. Aditya Rao",
      email: "aditya@clinic.com",
      specialty: "Ophthalmology",
      fee: 650,
      experience: 9,
      qualification: "MBBS, MS (Ophthalmology)",
      languages: ["English", "Hindi", "Kannada"],
      bio: "Cataract surgery, vision correction and complete eye-care specialist.",
      days: [2, 4, 6],
    },
    {
      name: "Dr. Meera Krishnan",
      email: "meera@clinic.com",
      specialty: "General Medicine",
      fee: 450,
      experience: 14,
      qualification: "MBBS, MD (General Medicine)",
      languages: ["English", "Hindi", "Malayalam"],
      bio: "Your first point of contact for fevers, infections and routine health screenings.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Dr. Sameer Khan",
      email: "sameer@clinic.com",
      specialty: "Dentistry",
      fee: 500,
      experience: 7,
      qualification: "BDS, MDS",
      languages: ["English", "Hindi", "Urdu"],
      bio: "Cleaning, fillings, root canals and cosmetic dentistry with a gentle touch.",
      days: [1, 4, 6],
    },
    {
      name: "Dr. Ananya Das",
      email: "ananya@clinic.com",
      specialty: "ENT",
      fee: 600,
      experience: 10,
      qualification: "MBBS, MS (ENT)",
      languages: ["English", "Hindi", "Bengali"],
      bio: "Ear, nose and throat specialist treating sinus, hearing and voice problems.",
      days: [2, 3, 5],
    },
    {
      name: "Dr. Pooja Malhotra",
      email: "pooja@clinic.com",
      specialty: "Gynecology",
      fee: 750,
      experience: 13,
      qualification: "MBBS, MD, DGO",
      languages: ["English", "Hindi", "Punjabi"],
      bio: "Women's health, prenatal care and gynecological wellness expert.",
      days: [1, 3, 4],
    },
    {
      name: "Dr. Vikram Singh",
      email: "vikram@clinic.com",
      specialty: "Psychiatry",
      fee: 800,
      experience: 12,
      qualification: "MBBS, MD (Psychiatry)",
      languages: ["English", "Hindi"],
      bio: "Compassionate care for anxiety, depression, stress and sleep disorders.",
      days: [2, 5, 6],
    },
    {
      name: "Dr. Nikhil Joshi",
      email: "nikhil@clinic.com",
      specialty: "Gastroenterology",
      fee: 850,
      experience: 11,
      qualification: "MBBS, MD, DM (Gastroenterology)",
      languages: ["English", "Hindi", "Marathi"],
      bio: "Digestive health expert for acidity, ulcers, liver and gut disorders.",
      days: [1, 3, 5],
    },
    {
      name: "Dr. Sanjana Pillai",
      email: "sanjana@clinic.com",
      specialty: "Pulmonology",
      fee: 750,
      experience: 9,
      qualification: "MBBS, MD (Pulmonary Medicine)",
      languages: ["English", "Hindi", "Tamil"],
      bio: "Asthma, breathing and respiratory-care specialist.",
      days: [2, 4],
    },
    {
      name: "Dr. Arvind Kumar",
      email: "arvind@clinic.com",
      specialty: "Urology",
      fee: 800,
      experience: 15,
      qualification: "MBBS, MS, MCh (Urology)",
      languages: ["English", "Hindi"],
      bio: "Kidney stones, urinary and men's health specialist.",
      days: [1, 4, 6],
    },
    {
      name: "Dr. Deepa Menon",
      email: "deepa@clinic.com",
      specialty: "Endocrinology",
      fee: 850,
      experience: 10,
      qualification: "MBBS, MD, DM (Endocrinology)",
      languages: ["English", "Hindi", "Malayalam"],
      bio: "Diabetes, thyroid and hormonal-balance specialist.",
      days: [2, 3, 5],
    },
  ];

  const doctors: { doctor: any; firstSlot: any }[] = [];
  for (const ds of doctorSeeds) {
    const user = await User.create({
      name: ds.name,
      email: ds.email,
      passwordHash: pw.doctor,
      role: "doctor",
      phone: "9000000010",
    });
    const doctor = await Doctor.create({
      user: user._id,
      specialty: ds.specialty,
      consultationFee: ds.fee,
      experience: ds.experience,
      qualification: ds.qualification,
      languages: ds.languages,
      bio: ds.bio,
    });
    // Create morning slots for each working day.
    const times = [
      ["09:00", "09:30"],
      ["09:30", "10:00"],
      ["10:00", "10:30"],
      ["11:00", "11:30"],
    ];
    let firstSlot = null;
    for (const day of ds.days) {
      for (const [startTime, endTime] of times) {
        const slot = await Slot.create({
          doctor: doctor._id,
          dayOfWeek: day,
          startTime,
          endTime,
          isActive: true,
        });
        if (!firstSlot) firstSlot = slot;
      }
    }
    doctors.push({ doctor, firstSlot });
  }

  // --- Patients ---
  const patientSeeds = [
    { name: "Rahul Verma", email: "rahul@example.com", phone: "9000000100" },
    { name: "Anjali Gupta", email: "anjali@example.com", phone: "9000000101" },
    { name: "Karan Singh", email: "karan@example.com", phone: "9000000102" },
  ];
  const patients = [];
  for (const ps of patientSeeds) {
    patients.push(
      await User.create({
        name: ps.name,
        email: ps.email,
        passwordHash: pw.patient,
        role: "patient",
        phone: ps.phone,
      })
    );
  }

  // --- Sample appointments ---
  // 1) A requested appointment with the cardiologist.
  const cardio = doctors[0];
  await Appointment.create({
    patient: patients[0]._id,
    doctor: cardio.doctor._id,
    slot: cardio.firstSlot._id,
    date: nextDateForWeekday(cardio.firstSlot.dayOfWeek),
    status: "Requested",
    reason: "Chest discomfort and fatigue",
    active: true,
  });

  // 2) A confirmed appointment with the dermatologist.
  const derma = doctors[1];
  await Appointment.create({
    patient: patients[1]._id,
    doctor: derma.doctor._id,
    slot: derma.firstSlot._id,
    date: nextDateForWeekday(derma.firstSlot.dayOfWeek),
    status: "Confirmed",
    reason: "Persistent skin rash",
    active: true,
  });

  // 3) A completed appointment (with bill + prescription) with the orthopedist.
  const ortho = doctors[2];
  const completed = await Appointment.create({
    patient: patients[2]._id,
    doctor: ortho.doctor._id,
    slot: ortho.firstSlot._id,
    date: nextDateForWeekday(ortho.firstSlot.dayOfWeek),
    status: "Completed",
    reason: "Knee pain after sports",
    active: true,
  });
  await Bill.create({
    appointment: completed._id,
    amount: ortho.doctor.consultationFee,
    status: "paid",
    invoiceNo: "INV-DEMO-001",
    paidAt: new Date(),
  });
  await Prescription.create({
    appointment: completed._id,
    notes: "Rest for 1 week. Apply ice twice daily. Avoid strenuous activity.",
    medicines: "Ibuprofen 400mg - twice daily after meals for 5 days",
  });

  // --- Announcements ---
  await Announcement.create({
    title: "Clinic Holiday Notice",
    message: "The clinic will remain closed on the upcoming national holiday.",
    postedBy: admin._id,
  });
  await Announcement.create({
    title: "New Pediatrics Department",
    message: "We are pleased to welcome Dr. Sneha Iyer to our Pediatrics department.",
    postedBy: admin._id,
  });

  // --- Patient testimonials / reviews ---
  await Review.insertMany([
    {
      patient: patients[2]._id,
      name: "Karan Singh",
      rating: 5,
      comment:
        "Dr. Rohit diagnosed my knee injury quickly and the recovery plan worked perfectly. Booking online was effortless!",
      treatmentFor: "Orthopedics consultation",
    },
    {
      name: "Meera Joshi",
      rating: 5,
      comment:
        "The clinic is spotless and the staff are incredibly caring. My daughter's pediatric visit was smooth and stress-free.",
      treatmentFor: "Pediatrics",
    },
    {
      name: "Vikram Rao",
      rating: 4,
      comment:
        "Very professional cardiology team. The doctor explained everything patiently and the digital reports are a great touch.",
      treatmentFor: "Cardiology",
    },
    {
      name: "Aisha Khan",
      rating: 5,
      comment:
        "Got my skin treatment done here — visible results within weeks. Highly recommend Dr. Priya!",
      treatmentFor: "Dermatology",
    },
    {
      name: "Sanjay Patel",
      rating: 5,
      comment:
        "No more long queues. I booked an appointment from my phone and was seen right on time. Fantastic experience.",
      treatmentFor: "General consultation",
    },
    {
      name: "Neha Reddy",
      rating: 4,
      comment:
        "Transparent billing and friendly doctors. The online prescription feature saved me a trip back to the clinic.",
      treatmentFor: "Dermatology",
    },
  ]);

  return { created: true };
}

// Allow running standalone: `npm run seed` (wipes + reseeds a real DB).
if (require.main === module) {
  (async () => {
    await connectDB();
    // Ensure indexes (incl. the partial unique slot-conflict index) exist.
    await Promise.all([
      User.syncIndexes(),
      Appointment.syncIndexes(),
      Bill.syncIndexes(),
    ]);
    const result = await seedDatabase(true);
    console.log(result.created ? "✅ Database seeded." : "ℹ️ Nothing to seed.");
    await disconnectDB();
    await mongoose.connection.close();
    process.exit(0);
  })().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
