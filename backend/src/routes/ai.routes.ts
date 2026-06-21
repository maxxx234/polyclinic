import { Router } from "express";
import { z } from "zod";
import { Doctor } from "../models/Doctor";
import { Appointment } from "../models/Appointment";
import { Bill } from "../models/Bill";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { validateBody } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import { optionalAuth } from "../middleware/optionalAuth";
import { env } from "../config/env";

const router = Router();

const KNOWN_SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Pediatrics",
  "Neurology",
  "Ophthalmology",
  "General Medicine",
  "Dentistry",
  "ENT",
  "Gynecology",
  "Psychiatry",
  "Gastroenterology",
  "Pulmonology",
  "Urology",
  "Endocrinology",
];

const symptomSchema = z.object({
  symptoms: z.string().min(3).max(2000),
});

interface Triage {
  specialty: string;
  possibleConditions: string[];
  urgency: "low" | "medium" | "high";
  advice: string;
}

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Calls the configured LLM (non-streaming) with a message array. */
async function callLLMMessages(messages: LLMMessage[]): Promise<string> {
  if (!env.LLM_ENDPOINT || !env.LLM_TOKEN) {
    throw new ApiError(503, "AI service is not configured");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(env.LLM_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.LLM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(502, `AI service error (${res.status})`);
    }
    const data = (await res.json()) as { content?: string };
    return data.content ?? "";
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "Could not reach the AI service. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

/** Convenience for a single-prompt call. */
async function callLLM(prompt: string): Promise<string> {
  return callLLMMessages([{ role: "user", content: prompt }]);
}

/** Extracts a JSON object from a model response that may be wrapped in prose/markdown. */
function parseTriage(text: string): Triage | null {
  let raw = text.trim();
  // strip ```json ... ``` fences if present
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(raw.slice(start, end + 1));
    return {
      specialty: String(obj.specialty ?? ""),
      possibleConditions: Array.isArray(obj.possibleConditions)
        ? obj.possibleConditions.map((c: unknown) => String(c)).slice(0, 4)
        : [],
      urgency: ["low", "medium", "high"].includes(obj.urgency) ? obj.urgency : "medium",
      advice: String(obj.advice ?? ""),
    };
  } catch {
    return null;
  }
}

// POST /api/ai/symptom-check  (public — usable on the landing page and portal)
router.post(
  "/symptom-check",
  validateBody(symptomSchema),
  asyncHandler(async (req, res) => {
    const { symptoms } = req.body as { symptoms: string };

    const prompt = `You are a careful medical triage assistant for a clinic. The clinic has these specialties: ${KNOWN_SPECIALTIES.join(
      ", "
    )}. Given the patient's symptoms, respond with ONLY a valid minified JSON object (no markdown, no commentary) using exactly these keys: "specialty" (choose the single best match from the list), "possibleConditions" (array of 2-3 short layperson condition names), "urgency" (one of "low", "medium", "high"), "advice" (one short, reassuring sentence; never a definitive diagnosis). Patient symptoms: "${symptoms}".`;

    const text = await callLLM(prompt);
    const triage = parseTriage(text);

    if (!triage) {
      throw new ApiError(502, "The AI returned an unexpected response. Please rephrase your symptoms.");
    }

    // Normalise the specialty to one we actually offer.
    let specialty =
      KNOWN_SPECIALTIES.find(
        (s) => s.toLowerCase() === triage.specialty.toLowerCase()
      ) ?? "General Medicine";

    // Find matching doctors; fall back to General Medicine, then any.
    let doctors = await Doctor.find({ specialty })
      .populate("user", "name")
      .select("specialty experience consultationFee qualification user")
      .lean();

    if (doctors.length === 0 && specialty !== "General Medicine") {
      const fallback = await Doctor.find({ specialty: "General Medicine" })
        .populate("user", "name")
        .lean();
      if (fallback.length) {
        doctors = fallback;
      }
    }
    if (doctors.length === 0) {
      doctors = await Doctor.find().populate("user", "name").limit(3).lean();
      if (doctors.length) specialty = doctors[0].specialty;
    }

    res.json({
      specialty,
      possibleConditions: triage.possibleConditions,
      urgency: triage.urgency,
      advice: triage.advice,
      disclaimer:
        "This is an AI-generated suggestion for guidance only and is not a medical diagnosis. Please consult a qualified doctor.",
      doctors,
    });
  })
);

// ---------------------------------------------------------------------------
// POST /api/ai/chat  -> role-aware assistant (works for guests and all roles)
// ---------------------------------------------------------------------------
const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const CLINIC_FACTS = `Clinic: Polyclinic, a modern multi-specialty clinic. Hours: Mon-Sat 9:00 AM - 8:00 PM. Phone: +91 98765 43210. Email: care@polyclinic.com. Address: 123 Health Avenue, MG Road, Bengaluru. Booking is online: choose a doctor and an available slot. Payment is after the consultation (bill generated when the doctor completes the visit). Patients can cancel from 'My Appointments'. Digital prescriptions are provided after visits. There is also an AI Symptom Checker that suggests the right specialty.`;

function systemPromptFor(role: string, name: string | undefined, context: string): string {
  const base = `You are "Poly", the friendly virtual assistant for Polyclinic. Be concise, warm and helpful. Use short paragraphs or bullet points. Never give a definitive medical diagnosis — for medical concerns, suggest the AI Symptom Checker or booking a doctor. ${CLINIC_FACTS} ${context}`;

  switch (role) {
    case "patient":
      return `${base}\nThe user is a logged-in PATIENT named ${name}. Help them: book/cancel appointments, understand bills & payments, view prescriptions, use the Symptom Checker, and navigate their portal (tabs: Book Appointment, Symptom Checker, My Appointments, Bills, Patient Corner, Notices).`;
    case "doctor":
      return `${base}\nThe user is a logged-in DOCTOR (${name}). Help them manage their work: confirming/completing/cancelling appointments, adding availability slots, writing prescriptions, and reading notices. Do not help with patient-only billing actions.`;
    case "admin":
      return `${base}\nThe user is a logged-in ADMIN (${name}). Help them with the admin console: the analytics dashboard, adding/removing doctors, viewing all appointments, and posting announcements.`;
    default:
      return `${base}\nThe user is a GUEST visitor on the public website. Encourage them to explore specialities, find a doctor, try the Symptom Checker, and create a free patient account to book. Answer questions about services, timings, location and how booking works.`;
  }
}

router.post(
  "/chat",
  optionalAuth,
  validateBody(chatSchema),
  asyncHandler(async (req, res) => {
    const role = req.user?.role ?? "guest";
    const name = req.user?.name;

    // Light, live context so the bot can answer "which doctors/specialities".
    const specialties = await Doctor.distinct("specialty");
    const docs = await Doctor.find().populate("user", "name").limit(12).lean();
    const docList = docs
      .map((d) => `${(d.user as { name?: string })?.name} (${d.specialty})`)
      .join(", ");
    const context = `Specialities offered: ${specialties.join(", ")}. Doctors: ${docList}.`;

    const messages = [
      { role: "system" as const, content: systemPromptFor(role, name, context) },
      ...(req.body.messages as { role: "user" | "assistant"; content: string }[]),
    ];

    const reply = await callLLMMessages(messages);
    res.json({ reply: reply.trim() || "Sorry, I couldn't generate a reply. Please try again." });
  })
);

// ---------------------------------------------------------------------------
// POST /api/ai/dashboard-insights -> AI-written, data-driven admin insights
// ---------------------------------------------------------------------------
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

router.post(
  "/dashboard-insights",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    const [appts, bills, doctors, patientCount] = await Promise.all([
      Appointment.find().lean(),
      Bill.find().lean(),
      Doctor.find().lean(),
      User.countDocuments({ role: "patient" }),
    ]);

    // Status breakdown
    const status: Record<string, number> = { Requested: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    appts.forEach((a) => { status[a.status] = (status[a.status] ?? 0) + 1; });

    // Appointments per weekday (find the busiest day)
    const byWeekday: Record<string, number> = {};
    appts.forEach((a) => {
      const d = WEEKDAYS[new Date(`${a.date}T00:00:00`).getDay()];
      byWeekday[d] = (byWeekday[d] ?? 0) + 1;
    });
    const busiestDay = Object.entries(byWeekday).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "N/A";

    // Top specialties by demand
    const specCount: Record<string, number> = {};
    const docSpec = new Map(doctors.map((d) => [String(d._id), d.specialty]));
    appts.forEach((a) => {
      const sp = docSpec.get(String(a.doctor));
      if (sp) specCount[sp] = (specCount[sp] ?? 0) + 1;
    });
    const topSpecialties = Object.entries(specCount)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([specialty, count]) => ({ specialty, count }));

    // Revenue
    const revenue = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
    const pending = bills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);

    // Today's load
    const appointmentsToday = appts.filter((a) => a.date === today && a.status !== "Cancelled").length;

    const totalDecided = status.Completed + status.Cancelled;
    const cancellationRate = totalDecided ? Math.round((status.Cancelled / totalDecided) * 100) : 0;

    const metrics = {
      totalPatients: patientCount,
      totalDoctors: doctors.length,
      totalAppointments: appts.length,
      appointmentsToday,
      statusBreakdown: status,
      busiestDay,
      appointmentsByWeekday: byWeekday,
      topSpecialties,
      revenueCollected: revenue,
      pendingDues: pending,
      cancellationRatePercent: cancellationRate,
    };

    const prompt = `You are a senior clinic operations analyst. Based on the following metrics for a multi-specialty clinic, respond with ONLY a valid minified JSON object (no markdown) with keys: "summary" (a 2-3 sentence data-driven narrative highlighting the most important trends, citing specific numbers) and "recommendations" (array of 2-4 short, concrete, actionable operational recommendations). Reference real numbers from the data. Metrics: ${JSON.stringify(metrics)}.`;

    let parsed: { summary: string; recommendations: string[] } | null = null;
    try {
      const text = await callLLM(prompt);
      const raw = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const obj = JSON.parse(raw.slice(start, end + 1));
        parsed = {
          summary: String(obj.summary ?? ""),
          recommendations: Array.isArray(obj.recommendations)
            ? obj.recommendations.map((r: unknown) => String(r)).slice(0, 4)
            : [],
        };
      }
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.summary) {
      // Graceful fallback so the dashboard never breaks.
      parsed = {
        summary: `You have ${metrics.totalAppointments} appointments across ${metrics.totalDoctors} doctors, with ${metrics.statusBreakdown.Completed} completed and ${metrics.appointmentsToday} scheduled today. ${busiestDay} is your busiest day. Collected revenue is ₹${revenue} with ₹${pending} pending.`,
        recommendations: [
          pending > 0 ? `Follow up on ₹${pending} in pending dues.` : "Keep collections on track.",
          topSpecialties[0] ? `${topSpecialties[0].specialty} is in highest demand — ensure adequate slots.` : "Monitor specialty demand.",
          cancellationRate > 20 ? `Cancellation rate is ${cancellationRate}% — consider reminders.` : "Cancellation rate is healthy.",
        ],
      };
    }

    res.json({ ...parsed, metrics, generatedAt: new Date().toISOString() });
  })
);

// POST /api/ai/wellness-tip -> one short, friendly wellness tip (for patient home)
router.post(
  "/wellness-tip",
  optionalAuth,
  asyncHandler(async (_req, res) => {
    try {
      const tip = await callLLM(
        "Give ONE short, friendly, general wellness or healthy-habit tip in under 18 words. No medical diagnosis, no preamble, just the tip."
      );
      res.json({ tip: tip.trim().replace(/^["']|["']$/g, "") });
    } catch {
      res.json({ tip: "Drink a glass of water and take a short walk — small habits add up!" });
    }
  })
);

export default router;
