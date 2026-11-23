import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../lib/errors";

interface Options {
  windowMs: number;
  max: number;
  /** Builds the bucket key. Defaults to the client IP. */
  key?: (req: Request) => string;
  message?: string;
}

/**
 * A small fixed-window rate limiter kept in memory. There is no Redis on shared hosting,
 * so limits are per process, which is fine for a single Node app.
 */
export function rateLimit(name: string, options: Options) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, options.windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${options.key ? options.key(req) : req.ip}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (entry.count > options.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return next(
        new AppError(429, "rate_limited", options.message ?? "Too many attempts. Please wait a few minutes and try again."),
      );
    }
    next();
  };
}
