import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  // Mongo duplicate key (e.g. slot-conflict engine, duplicate email/invoice).
  const e = err as { code?: number; message?: string };
  if (e && e.code === 11000) {
    res.status(409).json({ message: "That record already exists or conflicts with an existing one." });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
}
