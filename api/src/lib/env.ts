import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),

  DATABASE_URL: z.string().min(1),

  /** Public URL of the storefront, used for CORS, emails and payment return URLs. */
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  /** Public URL of this API. */
  API_ORIGIN: z.url().default("http://localhost:4000"),
  /** Set to ".latelylebanon.com" in production so the admin cookie works on both subdomains. */
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),

  UPLOAD_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("../uploads"),
  /** Public base URL for uploaded files. Defaults to `${API_ORIGIN}/uploads` for the local driver. */
  UPLOADS_PUBLIC_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Lately Lebanon <orders@latelylebanon.com>"),
  ADMIN_NOTIFY_EMAIL: z.string().default("info@latelylebanon.com"),

  CRON_SECRET: z.string().min(16),

  /** The web app's revalidation endpoint, called after admin edits so cached pages refresh. */
  REVALIDATE_URL: z.string().optional(),
  REVALIDATE_SECRET: z.string().optional(),

  PAYMENT_CARD_ENABLED: bool,
  MPGS_GATEWAY_URL: z.string().default("https://ap-gateway.mastercard.com"),
  MPGS_MERCHANT_ID: z.string().optional(),
  MPGS_API_PASSWORD: z.string().optional(),
  MPGS_API_VERSION: z.string().default("100"),
  MPGS_WEBHOOK_SECRET: z.string().optional(),

  PAYMENT_WHISH_ENABLED: bool,
  WHISH_API_URL: z.string().default("https://api.whish.money/itel-service/api"),
  WHISH_CHANNEL: z.string().optional(),
  WHISH_SECRET: z.string().optional(),
  WHISH_WEBSITE_URL: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  // An empty line like "SMTP_HOST=" in .env means "not set", so defaults apply.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ""));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${problems}`);
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
