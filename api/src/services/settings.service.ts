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
  whatsappNumber: null,
  contactEmail: "info@latelylebanon.com",
  heroHeading: "Lebanese brands, all in one place.",
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
    aboutImage: maybeImageSet(s.aboutImageKey, "About Lately Lebanon"),
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
    aboutImage: maybeImageSet(s.aboutImageKey, "About Lately Lebanon"),
    featuredBrandIds: asNumberArray(s.featuredBrandIds),
    featuredProductIds: asNumberArray(s.featuredProductIds),
  };
}

export async function updateSettings(data: z.output<typeof settingsSchema>): Promise<AdminSettings> {
  const previous = await loadSettings();
  await prisma.settings.update({ where: { id: 1 }, data });
  await deleteUnusedImages(
    [previous.heroImageKey, previous.aboutImageKey].filter((k) => k !== data.heroImageKey && k !== data.aboutImageKey),
  );
  refreshWebsite("settings", "catalog");
  return getAdminSettings();
}
