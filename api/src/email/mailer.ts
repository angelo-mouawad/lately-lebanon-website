import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    pool: false,
  });
  return transport;
}

/**
 * Sends a transactional email through the Hostinger mailbox.
 * Without SMTP settings (local development) the email is printed to the console instead.
 * Never throws: a failed email must not break an order.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    logger.info("Email (not sent, SMTP_HOST is empty)", { to: mail.to, subject: mail.subject, text: mail.text });
    return false;
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, ...mail });
    return true;
  } catch (err) {
    logger.error(`Email to ${mail.to} failed`, err);
    return false;
  }
}
