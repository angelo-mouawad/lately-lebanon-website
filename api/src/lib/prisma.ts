import { PrismaClient } from "@prisma/client";

/**
 * One Prisma client for the whole process. Hostinger allows 75 MySQL connections in total,
 * so keep `connection_limit` small in DATABASE_URL (for example `?connection_limit=5`).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
export type Db = PrismaClient | Tx;
