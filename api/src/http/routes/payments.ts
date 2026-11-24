import { Router } from "express";
import { z } from "zod";
import { env } from "../../lib/env";
import { confirmOnlinePayment } from "../../services/payments.service";
import { safeEqual } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { AppError } from "../../lib/errors";
import { parse } from "../validate";

/**
 * Return pages, callbacks and webhooks from payment providers.
 * None of them trust what they receive: each one asks the provider directly whether the
 * order was paid (see confirmOnlinePayment) before anything changes.
 */
export const paymentsRouter = Router();

const orderNumber = z.string().regex(/^LL-\d{5}$/);
const limiter = rateLimit("payments", { windowMs: 60_000, max: 60 });

paymentsRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/** The customer comes back from the provider's page. Check, then send them to the confirmation page. */
paymentsRouter.get(["/card/return", "/whish/return"], limiter, async (req, res) => {
  const number = parse(orderNumber, req.query.order);
  await confirmOnlinePayment(number);
  res.redirect(303, `${env.WEB_ORIGIN}/order-confirmed?number=${encodeURIComponent(number)}`);
});

/** Whish calls this when a payment succeeds or fails. */
paymentsRouter.all("/whish/callback", limiter, async (req, res) => {
  const number = parse(orderNumber, req.query.order);
  res.json({ result: await confirmOnlinePayment(number) });
});

/**
 * MPGS webhook notifications. The shared secret proves the call comes from the gateway,
 * and the order is still checked with the gateway's API before being marked paid.
 */
paymentsRouter.post("/card/webhook", limiter, async (req, res) => {
  const secret = req.get("x-notification-secret");
  if (!env.MPGS_WEBHOOK_SECRET || !secret || !safeEqual(secret, env.MPGS_WEBHOOK_SECRET)) {
    throw new AppError(401, "unauthorized", "Unauthorized");
  }
  const body = req.body as { order?: { id?: unknown } };
  const number = parse(orderNumber, body.order?.id);
  res.json({ result: await confirmOnlinePayment(number) });
});
