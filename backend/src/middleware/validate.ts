import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

/** Validates req.body against a Zod schema, replacing it with parsed data. */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Validation failed", result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}
