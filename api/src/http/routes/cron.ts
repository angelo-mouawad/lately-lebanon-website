import { Router } from "express";
import { purgeExpiredSessions } from "../../services/auth.service";
import { expireUnpaidOrders } from "../../services/orders.service";
import { requireCronSecret } from "../middleware/auth";

/**
 * Endpoints for Hostinger cron jobs. Each call must send the X-Cron-Secret header, for example:
 * curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" https://api.latelylebanon.com/cron/expire-unpaid-orders
 */
export const cronRouter = Router();

cronRouter.use(requireCronSecret);

cronRouter.post("/expire-unpaid-orders", async (_req, res) => {
  res.json({ cancelled: await expireUnpaidOrders() });
});

cronRouter.post("/purge-sessions", async (_req, res) => {
  res.json({ deleted: await purgeExpiredSessions() });
});
