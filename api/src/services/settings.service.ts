import type { z } from "zod";
import type { AdminSettings, StoreSettings, settingsSchema } from "@latelylebanon/shared";
import { prisma, type Db } from "../lib/prisma";
import { maybeImageSet } from "../storage/images";
import { deleteUnusedImages } from "./image-cleanup";
import { refreshWebsite } from "./revalidate";
import { asNumberArray } from "./serializers";

const DEFAULTS = {
  id: 1,
  storeName: "Lately Lebanon",
  whatsappNumber: "+96170000000",
  contactEmail: "info@latelylebanon.com",
  heroHeading: "Made in Lebanon, lately.",
  heroText: "",
  featuredBrandIds: [],
  featuredProductIds: [],
};

/** Settings is a single row with id 1. It's created with defaults the first time it's read. */
export async function loadSettings(db: Db = prisma) {
  return (
    (await db.settings.findUnique({ where: { id: 1 } })) ??
    (await db.settings.create({ data: DEFAULTS }))
  );
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const s = await loadSettings();
  return {
    storeName: s.storeName,
    whatsappNumber: s.whatsappNumber,
    whatsappNumber2: s.whatsappNumber2,
    contactEmail: s.contactEmail,
    instagramUrl: s.instagramUrl,
    freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
    announcementText: s.announcementText,
    announcementActive: s.announcementActive && Boolean(s.announcementText),
    heroHeading: s.heroHeading,
    heroText: s.heroText,
    heroImage: maybeImageSet(s.heroImageKey, s.heroHeading),
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const s = await loadSettings();
  return {
    storeName: s.storeName,
    whatsappNumber: s.whatsappNumber,
    whatsappNumber2: s.whatsappNumber2,
    contactEmail: s.contactEmail,
    instagramUrl: s.instagramUrl,
    freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
    announcementText: s.announcementText,
    announcementActive: s.announcementActive,
    heroHeading: s.heroHeading,
    heroText: s.heroText,
    heroImage: maybeImageSet(s.heroImageKey, s.heroHeading),
    featuredBrandIds: asNumberArray(s.featuredBrandIds),
    featuredProductIds: asNumberArray(s.featuredProductIds),
  };
}

export async function updateSettings(data: z.output<typeof settingsSchema>): Promise<AdminSettings> {
  const previous = await loadSettings();
  await prisma.settings.update({ where: { id: 1 }, data });
  if (previous.heroImageKey !== data.heroImageKey) await deleteUnusedImages([previous.heroImageKey]);
  refreshWebsite("settings", "catalog");
  return getAdminSettings();
}
