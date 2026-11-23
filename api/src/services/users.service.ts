import type { AdminUser } from "@prisma/client";
import type { z } from "zod";
import type { AdminUserRow, adminUserCreateSchema, adminUserUpdateSchema } from "@latelylebanon/shared";
import { badRequest, conflict, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./auth.service";

function toRow(u: AdminUser): AdminUserRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const rows = await prisma.adminUser.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return rows.map(toRow);
}

export async function createUser(data: z.output<typeof adminUserCreateSchema>): Promise<AdminUserRow> {
  if (await prisma.adminUser.findUnique({ where: { email: data.email } })) {
    throw conflict("Someone already has an account with that email.", { email: "Already has an account" });
  }
  const user = await prisma.adminUser.create({
    data: { name: data.name, email: data.email, role: data.role, passwordHash: await hashPassword(data.password) },
  });
  return toRow(user);
}

export async function updateUser(
  id: number,
  data: z.output<typeof adminUserUpdateSchema>,
  actingUserId: number,
): Promise<AdminUserRow> {
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) throw notFound("That person");

  const losesOwner = user.role === "OWNER" && (data.role !== "OWNER" || !data.isActive);
  if (losesOwner) {
    const otherOwners = await prisma.adminUser.count({ where: { role: "OWNER", isActive: true, id: { not: id } } });
    if (otherOwners === 0) throw badRequest("There must always be at least one active owner.");
  }
  if (id === actingUserId && !data.isActive) throw badRequest("You can't turn off your own account.");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.adminUser.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
    });
    // A new password or a turned off account logs that person out everywhere.
    if (data.password || !data.isActive) await tx.adminSession.deleteMany({ where: { userId: id } });
    return u;
  });
  return toRow(updated);
}
