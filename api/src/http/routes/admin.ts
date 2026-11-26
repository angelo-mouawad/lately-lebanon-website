import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  adminProductListQuerySchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
  brandSchema,
  categorySchema,
  changePasswordSchema,
  deliveryZoneSchema,
  loginSchema,
  orderListQuerySchema,
  orderStatusSchema,
  payoutSchema,
  productSchema,
  promoCodeSchema,
  reorderSchema,
  settingsSchema,
  UPLOAD_KINDS,
} from "@latelylebanon/shared";
import { badRequest } from "../../lib/errors";
import { env } from "../../lib/env";
import { processAndStoreImage } from "../../storage/images";
import * as auth from "../../services/auth.service";
import * as balances from "../../services/balances.service";
import * as brands from "../../services/brands.service";
import * as categories from "../../services/categories.service";
import { getDashboard } from "../../services/dashboard.service";
import * as orders from "../../services/orders.service";
import * as products from "../../services/products.service";
import * as promos from "../../services/promos.service";
import * as settings from "../../services/settings.service";
import * as users from "../../services/users.service";
import * as zones from "../../services/zones.service";
import {
  admin,
  requireAdmin,
  requireCsrf,
  requireOwner,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { parse, parseId } from "../validate";

export const adminRouter = Router();

// Admin data is private and must never be cached by the CDN or the browser.
adminRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* ---------- Auth ---------- */

const loginLimiter = rateLimit("login", {
  windowMs: 15 * 60_000,
  max: 8,
  key: (req) => `${req.ip}:${String(req.body?.email ?? "").toLowerCase()}`,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

adminRouter.post("/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const { token, user } = await auth.login(email, password, env.SESSION_TTL_DAYS, req.get("user-agent"));
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json(auth.toMe(user));
});

adminRouter.use(requireAdmin, requireCsrf);

adminRouter.get("/auth/me", (req, res) => {
  res.json(auth.toMe(admin(req)));
});

adminRouter.post("/auth/logout", async (req, res) => {
  await auth.logout(admin(req).sessionId);
  const { maxAge: _maxAge, ...cookie } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, cookie);
  res.status(204).end();
});

adminRouter.post("/auth/password", async (req, res) => {
  const me = admin(req);
  const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
  await auth.changePassword(me.id, currentPassword, newPassword, me.sessionId);
  res.status(204).end();
});

/* ---------- Dashboard ---------- */

adminRouter.get("/dashboard", async (req, res) => {
  res.json(await getDashboard(admin(req).role));
});

/* ---------- Uploads ---------- */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|avif|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(badRequest("Please upload a photo (JPG, PNG or WebP)."));
  },
});

adminRouter.post("/uploads", upload.single("file"), async (req, res) => {
  const kind = parse(z.enum(UPLOAD_KINDS), req.query.kind);
  if (!req.file) throw badRequest("Please choose a photo to upload.");
  res.status(201).json({ image: await processAndStoreImage(req.file.buffer, kind) });
});

/* ---------- Products ---------- */

adminRouter.get("/products", async (req, res) => {
  res.json(await products.listAdminProducts(parse(adminProductListQuerySchema, req.query)));
});

adminRouter.get("/products/:id", async (req, res) => {
  res.json(await products.getAdminProduct(parseId(req.params.id)));
});

adminRouter.post("/products", async (req, res) => {
  res.status(201).json(await products.createProduct(parse(productSchema, req.body)));
});

adminRouter.put("/products/:id", async (req, res) => {
  res.json(await products.updateProduct(parseId(req.params.id), parse(productSchema, req.body)));
});

adminRouter.post("/products/:id/duplicate", async (req, res) => {
  res.status(201).json(await products.duplicateProduct(parseId(req.params.id)));
});

adminRouter.post("/products/:id/archive", async (req, res) => {
  await products.archiveProduct(parseId(req.params.id));
  res.status(204).end();
});

/* ---------- Brands ---------- */

adminRouter.get("/brands", async (_req, res) => {
  res.json(await brands.listAdminBrands());
});

// Read-only list of our delivery areas, for the brand form's own delivery prices.
// Editing areas stays owner-only below.
adminRouter.get("/delivery-areas", async (_req, res) => {
  res.json(await zones.listZones());
});

adminRouter.get("/brands/:id", async (req, res) => {
  res.json(await brands.getAdminBrand(parseId(req.params.id)));
});

adminRouter.post("/brands", async (req, res) => {
  res.status(201).json(await brands.createBrand(parse(brandSchema, req.body)));
});

adminRouter.put("/brands/:id", async (req, res) => {
  res.json(await brands.updateBrand(parseId(req.params.id), parse(brandSchema, req.body)));
});

adminRouter.delete("/brands/:id", async (req, res) => {
  await brands.deleteBrand(parseId(req.params.id));
  res.status(204).end();
});

/* ---------- Categories ---------- */

adminRouter.get("/categories", async (_req, res) => {
  res.json(await categories.listAdminCategories());
});

adminRouter.post("/categories", async (req, res) => {
  res.status(201).json(await categories.createCategory(parse(categorySchema, req.body)));
});

adminRouter.put("/categories/reorder", async (req, res) => {
  res.json(await categories.reorderCategories(parse(reorderSchema, req.body).ids));
});

adminRouter.put("/categories/:id", async (req, res) => {
  res.json(await categories.updateCategory(parseId(req.params.id), parse(categorySchema, req.body)));
});

adminRouter.delete("/categories/:id", async (req, res) => {
  res.json(await categories.deleteCategory(parseId(req.params.id)));
});

/* ---------- Orders ---------- */

adminRouter.get("/orders", async (req, res) => {
  res.json(await orders.listOrders(parse(orderListQuerySchema, req.query)));
});

adminRouter.get("/orders/:id", async (req, res) => {
  res.json(await orders.getOrder(parseId(req.params.id)));
});

adminRouter.post("/orders/:id/status", async (req, res) => {
  const { status, note } = parse(orderStatusSchema, req.body);
  res.json(await orders.updateOrderStatus(parseId(req.params.id), status, note, admin(req).id));
});

adminRouter.post("/orders/:id/mark-paid", async (req, res) => {
  res.json(await orders.markOrderPaid(parseId(req.params.id), admin(req).id));
});

/* ---------- Owner only ---------- */

const owner = Router();
adminRouter.use(owner);
owner.use(requireOwner);

owner.get("/balances", async (_req, res) => {
  res.json(await balances.getBrandBalances());
});

owner.get("/balances.csv", async (_req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="brand-balances-${date}.csv"`);
  res.send("﻿" + (await balances.balancesCsv()));
});

owner.get("/payouts", async (req, res) => {
  const brandId = req.query.brandId ? parseId(req.query.brandId) : undefined;
  res.json(await balances.listPayouts(brandId));
});

owner.post("/payouts", async (req, res) => {
  res.status(201).json(await balances.recordPayout(parse(payoutSchema, req.body), admin(req).id));
});

owner.delete("/payouts/:id", async (req, res) => {
  await balances.deletePayout(parseId(req.params.id));
  res.status(204).end();
});

owner.get("/promo-codes", async (_req, res) => {
  res.json(await promos.listPromoCodes());
});

owner.post("/promo-codes", async (req, res) => {
  res.status(201).json(await promos.createPromoCode(parse(promoCodeSchema, req.body)));
});

owner.put("/promo-codes/:id", async (req, res) => {
  res.json(await promos.updatePromoCode(parseId(req.params.id), parse(promoCodeSchema, req.body)));
});

owner.delete("/promo-codes/:id", async (req, res) => {
  await promos.deletePromoCode(parseId(req.params.id));
  res.status(204).end();
});

owner.get("/delivery-zones", async (_req, res) => {
  res.json(await zones.listZones());
});

owner.post("/delivery-zones", async (req, res) => {
  res.status(201).json(await zones.createZone(parse(deliveryZoneSchema, req.body)));
});

owner.put("/delivery-zones/:id", async (req, res) => {
  res.json(await zones.updateZone(parseId(req.params.id), parse(deliveryZoneSchema, req.body)));
});

owner.delete("/delivery-zones/:id", async (req, res) => {
  await zones.deleteZone(parseId(req.params.id));
  res.status(204).end();
});

owner.get("/settings", async (_req, res) => {
  res.json(await settings.getAdminSettings());
});

owner.put("/settings", async (req, res) => {
  res.json(await settings.updateSettings(parse(settingsSchema, req.body)));
});

owner.get("/users", async (_req, res) => {
  res.json(await users.listUsers());
});

owner.post("/users", async (req, res) => {
  res.status(201).json(await users.createUser(parse(adminUserCreateSchema, req.body)));
});

owner.put("/users/:id", async (req, res) => {
  res.json(await users.updateUser(parseId(req.params.id), parse(adminUserUpdateSchema, req.body), admin(req).id));
});
