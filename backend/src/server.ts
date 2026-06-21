import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { seedDatabase } from "./seed";
import { User } from "./models/User";
import { Appointment } from "./models/Appointment";
import { Bill } from "./models/Bill";

async function main() {
  await connectDB();

  // Ensure indexes exist (incl. the partial unique slot-conflict index).
  await Promise.all([
    User.syncIndexes(),
    Appointment.syncIndexes(),
    Bill.syncIndexes(),
  ]);

  // Auto-seed when the database is empty so the app is usable immediately
  // (always the case with the in-memory dev DB).
  const { created } = await seedDatabase(false);
  if (created) {
    console.log("🌱 Seeded demo data (admin / doctors / patients).");
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`🚀 Polyclinic API running at http://localhost:${env.PORT}`);
    console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
