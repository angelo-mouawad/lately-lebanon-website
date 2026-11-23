import { Router } from "express";
import { z } from "zod";
import {
  cartQuoteSchema,
  checkoutSchema,
  productListQuerySchema,
  trackOrderSchema,
} from "@latelylebanon/shared";
import { enabledPaymentMethods } from "../../payments";
import * as catalog from "../../services/catalog.service";
import { placeOrder, quoteCart } from "../../services/checkout.service";
import { trackOrder } from "../../services/orders.service";
import { getStoreSettings } from "../../services/settings.service";
import { rateLimit } from "../middleware/rate-limit";
import { parse } from "../validate";

export const publicRouter = Router();

// The storefront caches these through Next.js, so the API itself doesn't cache them.
publicRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache");
  next();
});

const slugParam = z.string().regex(/^[a-z0-9-]{1,140}$/);

publicRouter.get("/settings", async (_req, res) => {
  res.json(await getStoreSettings());
});

publicRouter.get("/home", async (_req, res) => {
  res.json(await catalog.getHome());
});

publicRouter.get("/categories", async (_req, res) => {
  res.json(await catalog.listCategories());
});

publicRouter.get("/brands", async (_req, res) => {
  res.json(await catalog.listBrands());
});

publicRouter.get("/brands/:slug", async (req, res) => {
  res.json(await catalog.getBrand(parse(slugParam, req.params.slug)));
});

publicRouter.get("/products", async (req, res) => {
  res.json(await catalog.listProducts(parse(productListQuerySchema, req.query)));
});

publicRouter.get("/products/:slug", async (req, res) => {
  res.json(await catalog.getProduct(parse(slugParam, req.params.slug)));
});

publicRouter.get(
  "/search",
  rateLimit("search", { windowMs: 60_000, max: 120 }),
  async (req, res) => {
    const q = parse(z.string().trim().max(100).default(""), req.query.q);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(await catalog.searchSuggestions(q));
  },
);

publicRouter.get("/delivery-zones", async (_req, res) => {
  res.json(await catalog.listDeliveryZones());
});

publicRouter.get("/payment-methods", (_req, res) => {
  res.json(enabledPaymentMethods());
});

publicRouter.get("/sitemap", async (_req, res) => {
  res.json(await catalog.sitemapEntries());
});

publicRouter.post(
  "/cart/quote",
  rateLimit("quote", { windowMs: 60_000, max: 120 }),
  async (req, res) => {
    res.json(await quoteCart(parse(cartQuoteSchema, req.body)));
  },
);

publicRouter.post(
  "/checkout",
  rateLimit("checkout", {
    windowMs: 10 * 60_000,
    max: 10,
    message: "Too many orders from this connection. Please wait a few minutes or message us on WhatsApp.",
  }),
  async (req, res) => {
    res.status(201).json(await placeOrder(parse(checkoutSchema, req.body)));
  },
);

publicRouter.post(
  "/orders/track",
  rateLimit("track", { windowMs: 10 * 60_000, max: 30 }),
  async (req, res) => {
    const { number, phone } = parse(trackOrderSchema, req.body);
    res.json(await trackOrder(number, phone));
  },
);
