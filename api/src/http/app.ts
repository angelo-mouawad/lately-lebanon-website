import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { adminRouter } from "./routes/admin";
import { cronRouter } from "./routes/cron";
import { publicRouter } from "./routes/public";

export function createApp() {
  const app = express();

  // Hostinger runs the app behind a proxy; trust it so req.ip is the visitor's address.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // Images and JSON from this API are used by the storefront on another subdomain.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  if (env.UPLOAD_DRIVER === "local") {
    app.use(
      "/uploads",
      express.static(path.resolve(env.UPLOAD_DIR), {
        immutable: true,
        maxAge: "365d",
        index: false,
        dotfiles: "deny",
        fallthrough: false,
      }),
    );
  }

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.setHeader("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  app.use("/public", publicRouter);
  app.use("/admin", adminRouter);
  app.use("/cron", cronRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
