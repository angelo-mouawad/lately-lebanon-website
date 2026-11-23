import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { AdminRole, AdminMe } from "@latelylebanon/shared";
import { AppError, badRequest } from "../lib/errors";
import { prisma } from "../lib/prisma";

const BCRYPT_ROUNDS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

// Compared against when the email doesn't exist, so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  sessionId: string;
  csrfToken: string;
}

export function toMe(user: SessionUser): AdminMe {
  return { id: user.id, name: user.name, email: user.email, role: user.role, csrfToken: user.csrfToken };
}

/** Checks email and password and opens a session. Returns the raw token to put in the cookie. */
export async function login(email: string, password: string, ttlDays: number, userAgent?: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.isActive) {
    throw new AppError(401, "invalid_login", "That email and password don't match. Please try again.");
  }

  const raw = token();
  const csrfToken = token();
  await prisma.$transaction([
    prisma.adminSession.create({
      data: {
        id: sha256(raw),
        userId: user.id,
        csrfToken,
        expiresAt: new Date(Date.now() + ttlDays * DAY_MS),
        userAgent: userAgent?.slice(0, 255),
      },
    }),
    prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);
  const me: SessionUser = { id: user.id, name: user.name, email: user.email, role: user.role, sessionId: sha256(raw), csrfToken };
  return { token: raw, user: me };
}

/**
 * Looks up the session behind a cookie token. Sessions are extended when more than
 * half of their lifetime has passed, so active admins stay logged in.
 */
export async function getSessionUser(rawToken: string, ttlDays: number): Promise<SessionUser | null> {
  const id = sha256(rawToken);
  const session = await prisma.adminSession.findUnique({ where: { id }, include: { user: true } });
  if (!session || !session.user.isActive) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await prisma.adminSession.deleteMany({ where: { id } });
    return null;
  }
  if (session.expiresAt.getTime() - now < (ttlDays * DAY_MS) / 2) {
    await prisma.adminSession.update({ where: { id }, data: { expiresAt: new Date(now + ttlDays * DAY_MS) } });
  }
  const { user } = session;
  return { id: user.id, name: user.name, email: user.email, role: user.role, sessionId: id, csrfToken: session.csrfToken };
}

export async function logout(sessionId: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { id: sessionId } });
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string, keepSessionId: string) {
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw badRequest("Your current password is not right.", { currentPassword: "This password is not right" });
  }
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } }),
    // Log out every other device.
    prisma.adminSession.deleteMany({ where: { userId, id: { not: keepSessionId } } }),
  ]);
}

export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return count;
}
