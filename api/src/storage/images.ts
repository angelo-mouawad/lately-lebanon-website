import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { ImageSet, UploadKind } from "@latelylebanon/shared";
import { badRequest } from "../lib/errors";
import { storage } from "./index";

/**
 * Every upload is stored as three WebP files and the original is discarded.
 * The key carries the large size's dimensions, for example "products/k3j9a2_1600x2000",
 * which becomes "products/k3j9a2_1600x2000-400.webp" and so on.
 */
export const IMAGE_WIDTHS = { sm: 400, md: 800, lg: 1600 } as const;
const SIZES = Object.values(IMAGE_WIDTHS);

const FOLDERS: Record<UploadKind, string> = {
  product: "products",
  "brand-logo": "brands",
  "brand-cover": "brands",
  category: "categories",
  hero: "site",
};

const KEY_PATTERN = /_(\d+)x(\d+)$/;

function fileFor(key: string, width: number) {
  return `${key}-${width}.webp`;
}

export function imageSet(key: string, alt = ""): ImageSet {
  const match = KEY_PATTERN.exec(key);
  const width = match ? Number(match[1]) : IMAGE_WIDTHS.lg;
  const height = match ? Number(match[2]) : IMAGE_WIDTHS.lg;
  return {
    key,
    sm: storage.url(fileFor(key, IMAGE_WIDTHS.sm)),
    md: storage.url(fileFor(key, IMAGE_WIDTHS.md)),
    lg: storage.url(fileFor(key, IMAGE_WIDTHS.lg)),
    width,
    height,
    alt,
  };
}

export function maybeImageSet(key: string | null | undefined, alt = ""): ImageSet | null {
  return key ? imageSet(key, alt) : null;
}

async function openImage(input: Buffer) {
  try {
    const base = sharp(input, { limitInputPixels: 60_000_000, failOn: "error" }).rotate();
    const meta = await base.metadata();
    return meta.width && meta.height ? base : null;
  } catch {
    return null;
  }
}

export async function processAndStoreImage(input: Buffer, kind: UploadKind): Promise<ImageSet> {
  const base = await openImage(input);
  if (!base) throw badRequest("That file isn't a photo we can read. Please use a JPG, PNG or WebP image.");

  const outputs = await Promise.all(
    SIZES.map(async (width) => {
      const { data, info } = await base
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      return { width, data, info };
    }),
  );

  const large = outputs[outputs.length - 1]!.info;
  const key = `${FOLDERS[kind]}/${randomBytes(6).toString("hex")}_${large.width}x${large.height}`;

  await Promise.all(outputs.map((o) => storage.put(fileFor(key, o.width), o.data, "image/webp")));
  return imageSet(key);
}

export async function deleteImage(key: string): Promise<void> {
  await Promise.all(SIZES.map((w) => storage.delete(fileFor(key, w))));
}
