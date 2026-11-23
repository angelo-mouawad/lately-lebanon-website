import type { z } from "zod";
import type { AdminDeliveryZone, deliveryZoneSchema } from "@latelylebanon/shared";
import { notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { refreshWebsite } from "./revalidate";

type ZoneData = z.output<typeof deliveryZoneSchema>;

const select = { id: true, name: true, feeCents: true, isActive: true, sortOrder: true } as const;

export async function listZones(): Promise<AdminDeliveryZone[]> {
  return prisma.deliveryZone.findMany({ select, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function createZone(data: ZoneData): Promise<AdminDeliveryZone> {
  const zone = await prisma.deliveryZone.create({ data, select });
  refreshWebsite("settings");
  return zone;
}

export async function updateZone(id: number, data: ZoneData): Promise<AdminDeliveryZone> {
  if (!(await prisma.deliveryZone.findUnique({ where: { id } }))) throw notFound("That delivery area");
  const zone = await prisma.deliveryZone.update({ where: { id }, data, select });
  refreshWebsite("settings");
  return zone;
}

/** Past orders keep the area name they were placed with, so deleting is safe. */
export async function deleteZone(id: number): Promise<void> {
  const { count } = await prisma.deliveryZone.deleteMany({ where: { id } });
  if (count === 0) throw notFound("That delivery area");
  refreshWebsite("settings");
}
