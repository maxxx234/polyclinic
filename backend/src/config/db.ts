import mongoose from "mongoose";
import { env } from "./env";

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is set, connect to that (local server or Atlas).
 * - Otherwise spin up an in-memory MongoDB so the app runs with zero setup.
 */
export async function connectDB(): Promise<string> {
  let uri = env.MONGODB_URI;

  if (!uri) {
    // Lazy import so production builds don't require the dev dependency.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    memoryServer = mem;
    uri = mem.getUri("polyclinic");
    console.log("⚠️  No MONGODB_URI set — using in-memory MongoDB (data resets on restart).");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
