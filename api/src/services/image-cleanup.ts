import { prisma } from "../lib/prisma";
import { deleteImage } from "../storage/images";

/**
 * Removes image files that no product, brand, category or settings row uses any more.
 * Duplicated products share photos, so a file is only deleted when its last user is gone.
 */
export async function deleteUnusedImages(keys: (string | null | undefined)[]): Promise<void> {
  for (const key of new Set(keys.filter((k): k is string => Boolean(k)))) {
    const [images, brands, categories, settings] = await Promise.all([
      prisma.productImage.count({ where: { key } }),
      prisma.brand.count({ where: { OR: [{ logoKey: key }, { coverKey: key }] } }),
      prisma.category.count({ where: { imageKey: key } }),
      prisma.settings.count({ where: { OR: [{ heroImageKey: key }, { aboutImageKey: key }] } }),
    ]);
    if (images + brands + categories + settings === 0) await deleteImage(key);
  }
}
