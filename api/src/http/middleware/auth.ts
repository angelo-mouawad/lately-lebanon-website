import { timingSafeEqual } from "node:crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";
import { forbidden, unauthorized, AppError } from "../../lib/errors";
import { env, isProd } from "../../lib/env";
import { getSessionUser, type SessionUser } from "../../services/auth.service";

declare global {
  namespace Express {
    interface Request {
      admin?: SessionUser;
    }
  }
}

export const SESSION_COOKIE = "ll_session";

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function admin(req: Request): SessionUser {
  if (!req.admin) throw unauthorized();
  return req.admin;
}

/** Requires a valid admin session cookie. */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || !token) return next(unauthorized());
  const user = await getSessionUser(token, env.SESSION_TTL_DAYS);
  if (!user) return next(unauthorized());
  req.admin = user;
  next();
}

/**
 * CSRF protection for cookie auth: every request that changes something must send the
 * session's CSRF token in the X-CSRF-Token header. Other sites can't read that token.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const header = req.get("x-csrf-token");
  if (!req.admin || !header || !safeEqual(header, req.admin.csrfToken)) {
    return next(new AppError(403, "csrf", "Your session has expired. Please refresh the page and try again."));
  }
  next();
}

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (req.admin?.role !== "OWNER") return next(forbidden());
  next();
}

/** Protects cron endpoints with the CRON_SECRET header. */
export function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  const header = req.get("x-cron-secret");
  if (!header || !safeEqual(header, env.CRON_SECRET)) return next(new AppError(401, "unauthorized", "Unauthorized"));
  next();
}
