import dotenv from "dotenv";

dotenv.config();

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  PORT: parseInt(process.env.PORT || "4000", 10),
  // Comma-separated list of allowed frontend origins.
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  LLM_ENDPOINT: process.env.LLM_ENDPOINT || "",
  LLM_TOKEN: process.env.LLM_TOKEN || "",
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@clinic.com",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
};

/** Parsed list of allowed CORS origins. */
export const allowedOrigins = env.CLIENT_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
