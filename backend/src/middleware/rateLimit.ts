import rateLimit from "express-rate-limit";

/**
 * Strict limiter for AI endpoints — these call the paid LLM, so we cap usage
 * per IP to prevent abuse and runaway cost.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 AI requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "You've sent a lot of AI requests. Please wait a few minutes and try again.",
  },
});

/**
 * Generous global limiter as a general abuse backstop. High enough not to
 * interfere with normal use (incl. the app's 25s notification/badge polling).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});
