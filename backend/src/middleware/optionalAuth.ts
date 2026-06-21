import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

/** Attaches req.user if a valid Bearer token is present; never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.user = { id: payload.sub, role: payload.role, name: payload.name };
    } catch {
      /* ignore invalid token — treat as guest */
    }
  }
  next();
}
