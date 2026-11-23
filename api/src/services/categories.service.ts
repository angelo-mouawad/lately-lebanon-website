import type { z } from "zod";
import type { AdminCategory, categorySchema } from "@latelylebanon/shared";
import { badRequest, conflict, notFound } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { maybeImageSet } from "../storage/images";
import { deleteUnusedImages } from "./image-cleanup";
import { uniqueSlug } from "./slugs";
import { refreshWebsite } from "./revalidate";

type CategoryData = z.output<typeof categorySchema>;

const slugTaken = (exceptId?: number) => async (slug: string) =>
  Boolean(await prisma.category.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined }, select: { id: true } }));

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { status: { not: "ARCHIVED" } } } } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: maybeImageSet(c.imageKey, c.name),
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
  }));
}

async function assertParent(parentId: number | null | undefined, selfId?: number) {
  if (!parentId) return;
  if (parentId === selfId) throw badRequest("A category can't be inside itself.", { parentId: "Choose another category" });
  const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
  if (!parent) throw badRequest("That parent category no longer exists.", { parentId: "Choose another category" });
  if (parent.parentId) {
    throw badRequest("Categories can only be one level deep.", { parentId: "Choose a main category" });
  }
}

export async function createCategory(data: CategoryData): Promise<AdminCategory[]> {
  await assertParent(data.parentId);
  if (data.slug && (await slugTaken()(data.slug))) {
    throw conflict("Another category already uses this web address.", { slug: "Already used" });
  }
  await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug ?? (await uniqueSlug(data.name, slugTaken())),
      imageKey: data.imageKey ?? null,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder,
    },
  });
  refreshWebsite("catalog");
  return listAdminCategories();
}

export async function updateCategory(id: number, data: CategoryData): Promise<AdminCategory[]> {
  const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true } } } });
  if (!existing) throw notFound("That category");
  await assertParent(data.parentId, id);
  if (data.parentId && existing._count.children > 0) {
    throw badRequest("This category has its own sub categories, so it can't go inside another one.");
  }
  const slug = data.slug ?? existing.slug;
  if (slug !== existing.slug && (await slugTaken(id)(slug))) {
    throw conflict("Another category already uses this web address.", { slug: "Already used" });
  }
  await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      imageKey: data.imageKey ?? null,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder,
    },
  });
  if (existing.imageKey !== (data.imageKey ?? null)) await deleteUnusedImages([existing.imageKey]);
  refreshWebsite("catalog");
  return listAdminCategories();
}

/** Saves a new order for the categories, in the order the ids are given. */
export async function reorderCategories(ids: number[]): Promise<AdminCategory[]> {
  await prisma.$transaction(ids.map((id, index) => prisma.category.updateMany({ where: { id }, data: { sortOrder: index } })));
  refreshWebsite("catalog");
  return listAdminCategories();
}

export async function deleteCategory(id: number): Promise<AdminCategory[]> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw notFound("That category");
  if (category._count.products > 0) {
    throw conflict("This category still has products. Move them to another category first.");
  }
  await prisma.category.delete({ where: { id } });
  await deleteUnusedImages([category.imageKey]);
  refreshWebsite("catalog");
  return listAdminCategories();
}
