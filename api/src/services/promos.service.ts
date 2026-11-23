import type { PromoCode } from "@prisma/client";
import type { z } from "zod";
import type { AdminPromoCode, promoCodeSchema } from "@latelylebanon/shared";
import { conflict, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";

type PromoData = z.output<typeof promoCodeSchema>;

/** A code entered as valid until a date works until the end of that day in Beirut. */
const endOfDayBeirut = (date: string) => new Date(`${date}T23:59:59.999+02:00`);

function toAdmin(p: PromoCode): AdminPromoCode {
  return {
    id: p.id,
    code: p.code,
    type: p.type,
    value: p.value,
    minOrderCents: p.minOrderCents,
    expiresAt: p.expiresAt ? p.expiresAt.toISOString().slice(0, 10) : null,
    usageLimit: p.usageLimit,
    timesUsed: p.timesUsed,
    isActive: p.isActive,
  };
}

function fields(data: PromoData) {
  return {
    code: data.code,
    type: data.type,
    value: data.value,
    minOrderCents: data.minOrderCents,
    expiresAt: data.expiresAt ? endOfDayBeirut(data.expiresAt) : null,
    usageLimit: data.usageLimit ?? null,
    isActive: data.isActive,
  };
}

async function assertCodeFree(code: string, exceptId?: number) {
  const taken = await prisma.promoCode.findFirst({ where: { code, id: exceptId ? { not: exceptId } : undefined } });
  if (taken) throw conflict("That code already exists.", { code: "This code already exists" });
}

export async function listPromoCodes(): Promise<AdminPromoCode[]> {
  const rows = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toAdmin);
}

export async function createPromoCode(data: PromoData): Promise<AdminPromoCode> {
  await assertCodeFree(data.code);
  return toAdmin(await prisma.promoCode.create({ data: fields(data) }));
}

export async function updatePromoCode(id: number, data: PromoData): Promise<AdminPromoCode> {
  if (!(await prisma.promoCode.findUnique({ where: { id } }))) throw notFound("That code");
  await assertCodeFree(data.code, id);
  return toAdmin(await prisma.promoCode.update({ where: { id }, data: fields(data) }));
}

export async function deletePromoCode(id: number): Promise<void> {
  const { count } = await prisma.promoCode.deleteMany({ where: { id } });
  if (count === 0) throw notFound("That code");
}
