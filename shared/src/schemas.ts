import { z } from "zod";
import {
  ADMIN_ROLES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PRODUCT_SORTS,
  PRODUCT_STATUSES,
  PROMO_TYPES,
} from "./enums";
import { normalizeLebanesePhone } from "./phone";

const text = (max: number, message = "Please fill this in") =>
  z.string({ error: message }).trim().min(1, message).max(max, `Keep this under ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

const optionalEmail = z
  .union([z.literal(""), z.email("Please enter a valid email address")])
  .nullish()
  .transform((v) => (v ? v.toLowerCase() : null));

const optionalUrl = z
  .union([z.literal(""), z.url("Please enter a full link starting with https://")])
  .nullish()
  .transform((v) => (v ? v : null));

const slug = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  ])
  .nullish()
  .transform((v) => (v ? v : null));

const optionalDate = z
  .union([z.literal(""), z.iso.date("Please choose a date")])
  .nullish()
  .transform((v) => (v ? v : null));

export const lebanesePhone = z
  .string()
  .trim()
  .min(1, "Please enter a phone number")
  .transform((value, ctx) => {
    const normalized = normalizeLebanesePhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Please enter a Lebanese number, for example 70 123 456 or 03 123 456",
      });
      return z.NEVER;
    }
    return normalized;
  });

/** An optional Lebanese number: empty becomes null, anything else must be valid. */
const optionalLebanesePhone = z
  .union([z.literal(""), lebanesePhone])
  .nullish()
  .transform((v) => (v ? v : null));

const cents = (message = "Please enter a price") =>
  z
    .number({ error: message })
    .int("Use whole cents")
    .min(0, "This can't be negative")
    .max(100_000_000, "That amount is too large");

const percent = z
  .number({ error: "Please enter a percentage" })
  .min(0, "This can't be negative")
  .max(100, "This can't be more than 100");

const imageKey = z.string().trim().min(1).max(255);

/* ---------- Storefront ---------- */

export const cartLineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

export const cartQuoteSchema = z.object({
  items: z.array(cartLineSchema).max(50),
  zoneId: z.number().int().positive().nullish(),
  promoCode: z.string().trim().max(40).nullish(),
});
export type CartQuoteInput = z.infer<typeof cartQuoteSchema>;

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your bag is empty").max(50),
  customer: z.object({
    name: text(120, "Please enter your full name"),
    phone: lebanesePhone,
    email: optionalEmail,
    city: text(80, "Please enter your town or city"),
    zoneId: z.number({ error: "Please choose your area" }).int().positive("Please choose your area"),
    address: text(500, "Please enter your address"),
    notes: optionalText(500),
  }),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Please choose how you want to pay" }),
  promoCode: z.string().trim().max(40).nullish(),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const trackOrderSchema = z.object({
  number: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => (v.startsWith("LL-") ? v : `LL-${v}`))
    .pipe(z.string().regex(/^LL-\d{5}$/, "Order numbers look like LL-10482")),
  phone: lebanesePhone,
});

export const productListQuerySchema = z.object({
  category: z.string().trim().max(140).optional(),
  brand: z.string().trim().max(400).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  inStock: z
    .enum(["1", "true"])
    .optional()
    .transform((v) => Boolean(v)),
  sort: z.enum(PRODUCT_SORTS).optional().default("newest"),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(24),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/* ---------- Admin ---------- */

export const loginSchema = z.object({
  email: z.email("Please enter your email").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Please enter your password").max(200),
});

export const brandSchema = z
  .object({
    name: text(120, "Please enter the brand name"),
    slug,
    logoKey: imageKey.nullish(),
    coverKey: imageKey.nullish(),
    story: z.string().trim().max(5000).default(""),
    instagramUrl: optionalUrl,
    contactName: optionalText(120),
    phone: optionalText(40),
    email: optionalEmail,
    commissionPct: percent,
    ownDelivery: z.boolean().default(false),
    deliveryFees: z
      .array(z.object({ zoneId: z.number().int().positive(), feeCents: cents("Please enter the delivery fee") }))
      .max(500)
      .default([]),
    internalNotes: optionalText(5000),
    isActive: z.boolean().default(true),
  })
  .superRefine((b, ctx) => {
    if (b.ownDelivery && b.deliveryFees.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryFees"],
        message: "Enter the brand's price for at least one delivery area, or switch off its own delivery",
      });
    }
    if (new Set(b.deliveryFees.map((f) => f.zoneId)).size !== b.deliveryFees.length) {
      ctx.addIssue({ code: "custom", path: ["deliveryFees"], message: "Each area can only have one price" });
    }
  });
export type BrandInput = z.input<typeof brandSchema>;

export const categorySchema = z.object({
  name: text(80, "Please enter the category name"),
  slug,
  imageKey: imageKey.nullish(),
  parentId: z.number().int().positive().nullish(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});
export type CategoryInput = z.input<typeof categorySchema>;

export const reorderSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

export const productOptionSchema = z.object({
  name: text(40, "Name this option, for example Size"),
  values: z.array(text(40)).min(1, "Add at least one choice").max(30),
});

export const productVariantSchema = z.object({
  id: z.number().int().positive().optional(),
  options: z.record(z.string(), z.string()).default({}),
  sku: optionalText(64),
  priceCents: cents().nullish(),
  stock: z
    .number({ error: "Please enter how many are in stock" })
    .int("Use a whole number")
    .min(0, "Stock can't be negative")
    .max(100_000),
});

export const productImageSchema = z.object({
  key: imageKey,
  alt: z.string().trim().max(200).default(""),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const productSchema = z
  .object({
    name: text(160, "Please enter the product name"),
    slug,
    brandId: z.number({ error: "Please choose a brand" }).int().positive("Please choose a brand"),
    categoryId: z.number({ error: "Please choose a category" }).int().positive("Please choose a category"),
    description: z.string().trim().max(10000).default(""),
    priceCents: cents(),
    compareAtCents: cents().nullish(),
    commissionPct: percent.nullish(),
    status: z.enum(PRODUCT_STATUSES).default("DRAFT"),
    featured: z.boolean().default(false),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    seoTitle: optionalText(160),
    seoDescription: optionalText(320),
    options: z.array(productOptionSchema).max(3, "Use at most 3 options").default([]),
    variants: z.array(productVariantSchema).min(1).max(200),
    images: z.array(productImageSchema).max(20, "Use at most 20 photos").default([]),
  })
  .superRefine((p, ctx) => {
    if (p.compareAtCents != null && p.compareAtCents <= p.priceCents) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtCents"],
        message: "The old price should be higher than the price",
      });
    }
    if (p.status === "PUBLISHED" && p.images.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["images"],
        message: "Add at least one photo before showing this on the website",
      });
    }
    const names = p.options.map((o) => o.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Each option needs a different name" });
    }
  });
export type ProductInput = z.input<typeof productSchema>;
export type ProductData = z.output<typeof productSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: optionalText(500),
});

export const orderListQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const adminProductListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const payoutSchema = z.object({
  brandId: z.number().int().positive(),
  amountCents: z
    .number({ error: "Please enter the amount" })
    .int()
    .positive("The amount must be more than zero"),
  paidAt: z.iso.date("Please choose a date"),
  method: text(60, "How was it paid? For example Cash or Bank transfer"),
  note: optionalText(500),
});

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/, "Use 3 to 40 letters or numbers, no spaces"),
    type: z.enum(PROMO_TYPES),
    value: z
      .number({ error: "Please enter a value" })
      .int()
      .positive("The value must be more than zero"),
    minOrderCents: cents().default(0),
    expiresAt: optionalDate,
    usageLimit: z.number().int().positive().nullish(),
    isActive: z.boolean().default(true),
  })
  .refine((p) => p.type !== "PERCENT" || p.value <= 100, {
    path: ["value"],
    message: "A percentage can't be more than 100",
  });

export const deliveryZoneSchema = z.object({
  name: text(80, "Please enter the area name"),
  feeCents: cents("Please enter the delivery fee"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const settingsSchema = z.object({
  storeName: text(80),
  whatsappNumber: lebanesePhone,
  whatsappNumber2: optionalLebanesePhone,
  contactEmail: z.email("Please enter a valid email address"),
  instagramUrl: optionalUrl,
  freeDeliveryThresholdCents: cents().nullish(),
  announcementText: optionalText(200),
  announcementActive: z.boolean(),
  heroHeading: text(120),
  heroText: z.string().trim().max(400).default(""),
  heroImageKey: imageKey.nullish(),
  aboutImageKey: imageKey.nullish(),
  featuredBrandIds: z.array(z.number().int().positive()).max(12),
  featuredProductIds: z.array(z.number().int().positive()).max(24),
});

const password = z.string().min(10, "Use at least 10 characters").max(200);

export const adminUserCreateSchema = z.object({
  name: text(120, "Please enter a name"),
  email: z.email("Please enter a valid email address").transform((v) => v.toLowerCase()),
  role: z.enum(ADMIN_ROLES),
  password,
});

export const adminUserUpdateSchema = z.object({
  name: text(120, "Please enter a name"),
  role: z.enum(ADMIN_ROLES),
  isActive: z.boolean(),
  password: z
    .union([z.literal(""), password])
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password"),
  newPassword: password,
});
