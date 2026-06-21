import express from "express";
import cors from "cors";
import helmet from "helmet";
import { allowedOrigins } from "./config/env";
import { notFound, errorHandler } from "./middleware/error";
import { aiLimiter, apiLimiter } from "./middleware/rateLimit";

import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/doctors.routes";
import slotRoutes from "./routes/slots.routes";
import appointmentRoutes from "./routes/appointments.routes";
import billRoutes from "./routes/bills.routes";
import prescriptionRoutes from "./routes/prescriptions.routes";
import announcementRoutes from "./routes/announcements.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import publicRoutes from "./routes/public.routes";
import reviewRoutes from "./routes/reviews.routes";
import notificationRoutes from "./routes/notifications.routes";
import aiRoutes from "./routes/ai.routes";
import adminRoutes from "./routes/admin.routes";
import patientRoutes from "./routes/patient.routes";

export function createApp() {
  const app = express();

  // Trust the first proxy (Render/Railway/Vercel) so rate limiting sees the
  // real client IP rather than the proxy's.
  app.set("trust proxy", 1);

  // Secure HTTP headers. CSP is disabled (this is a JSON API, not serving HTML)
  // and resource policy is cross-origin so the separate frontend can call it.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow non-browser clients (no origin) and any whitelisted origin.
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "polyclinic-api", time: new Date().toISOString() });
  });

  // General abuse backstop across the whole API.
  app.use("/api", apiLimiter);

  app.use("/api/public", publicRoutes);
  // Strict limiter in front of the LLM-backed AI routes.
  app.use("/api/ai", aiLimiter, aiRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/slots", slotRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/bills", billRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/patient", patientRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
