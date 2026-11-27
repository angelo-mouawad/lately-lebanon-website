import {
  formatLebanesePhone,
  formatUSD,
  PAYMENT_METHOD_LABELS,
  whatsappDigits,
  type PaymentMethod,
} from "@latelylebanon/shared";

export interface EmailOrder {
  number: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  region: string;
  address: string;
  notes: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  promoCode: string | null;
  paymentMethod: PaymentMethod;
  items: { productName: string; variantLabel: string; quantity: number; lineTotalCents: number; brandName: string }[];
  /** Brands delivering their own items on this order, with the fee they charged. */
  brandDeliveries: { brandName: string; feeCents: number }[];
}

export interface EmailContext {
  storeName: string;
  webOrigin: string;
  /** The shop's WhatsApp numbers, main one first. */
  whatsappNumbers: string[];
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ink = "#1B1815";
const sand = "#F4EFE6";
const line = "#D8CFC0";
const accent = "#A8492A";
/** Background of the logo image, so the footer and logo blend into one band. */
const logoBeige = "#F2E6D8";

const siteLabel = (ctx: EmailContext) => ctx.webOrigin.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** "03 550 789 or 03 168 527", each number kept on one line. */
const phoneListHtml = (ctx: EmailContext) =>
  ctx.whatsappNumbers.map((n) => `<span style="white-space:nowrap;">${escape(formatLebanesePhone(n))}</span>`).join(" or ");

/** "Questions?" line. Mentions WhatsApp only when the shop has a number set. */
const questionsHtml = (ctx: EmailContext) =>
  ctx.whatsappNumbers.length
    ? `Questions? Reply to this email or message us on WhatsApp at ${phoneListHtml(ctx)}.`
    : "Questions? Just reply to this email.";
const questionsText = (ctx: EmailContext) =>
  ctx.whatsappNumbers.length ? "Questions? Reply to this email or message us on WhatsApp." : "Questions? Just reply to this email.";

/** Footer shared by every email: logo, website and, when set, WhatsApp. */
function footer(ctx: EmailContext): string {
  const links = ctx.whatsappNumbers
    .map((n) => `<a href="https://wa.me/${whatsappDigits(n)}" style="color:${ink};text-decoration:underline;white-space:nowrap;">${escape(formatLebanesePhone(n))}</a>`)
    .join(" · ");
  return `<tr><td align="center" style="padding:28px 28px 24px;background:${logoBeige};border-top:1px solid ${line};font-size:13px;line-height:1.7;color:${ink};">
<a href="${ctx.webOrigin}" style="text-decoration:none;"><img src="${ctx.webOrigin}/brand/lately-lebanon-logo-email.png" width="280" alt="${escape(ctx.storeName)}, a curated marketplace" style="display:block;width:280px;max-width:100%;height:auto;margin:0 auto 14px;border:0;"></a>
<a href="${ctx.webOrigin}" style="color:${ink};text-decoration:underline;">${escape(siteLabel(ctx))}</a>${links ? `<br>
WhatsApp: ${links}` : ""}
</td></tr>`;
}

/** Plain-text version of the footer. */
function textFooter(ctx: EmailContext): string {
  const wa = ctx.whatsappNumbers.length ? `WhatsApp: ${ctx.whatsappNumbers.map(formatLebanesePhone).join(" / ")}\n` : "";
  return `--
${ctx.storeName}, a curated marketplace
${siteLabel(ctx)}
${wa}`;
}

function layout(ctx: EmailContext, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${sand};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${sand};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${line};font-family:Helvetica,Arial,sans-serif;color:${ink};">
<tr><td style="padding:24px 28px;border-bottom:1px solid ${line};font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.5px;">${escape(ctx.storeName)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${body}</td></tr>
${footer(ctx)}
</table></td></tr></table></body></html>`;
}

function itemsTable(order: EmailOrder): string {
  const rows = order.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${line};">${escape(i.productName)}${i.variantLabel ? `<br><span style="font-size:13px;color:#6B635A;">${escape(i.variantLabel)}</span>` : ""}<br><span style="font-size:12px;color:#6B635A;">by ${escape(i.brandName)}</span></td>
<td style="padding:10px 0;border-bottom:1px solid ${line};text-align:center;white-space:nowrap;">x ${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid ${line};text-align:right;white-space:nowrap;">${formatUSD(i.lineTotalCents)}</td>
</tr>`,
    )
    .join("");
  const summary = [
    ["Subtotal", formatUSD(order.subtotalCents)],
    ...(order.discountCents > 0
      ? [[`Discount${order.promoCode ? ` (${escape(order.promoCode)})` : ""}`, `-${formatUSD(order.discountCents)}`]]
      : []),
    ["Delivery", order.deliveryFeeCents === 0 ? "Free" : formatUSD(order.deliveryFeeCents)],
  ]
    .map(
      ([label, value]) =>
        `<tr><td colspan="2" style="padding:6px 0;color:#6B635A;">${label}</td><td style="padding:6px 0;text-align:right;">${value}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0;">${rows}${summary}
<tr><td colspan="2" style="padding:10px 0;border-top:1px solid ${ink};font-weight:bold;">Total</td><td style="padding:10px 0;border-top:1px solid ${ink};text-align:right;font-weight:bold;">${formatUSD(order.totalCents)}</td></tr></table>`;
}

function itemsText(order: EmailOrder): string {
  return [
    ...order.items.map(
      (i) => `${i.quantity} x ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}: ${formatUSD(i.lineTotalCents)}`,
    ),
    `Subtotal: ${formatUSD(order.subtotalCents)}`,
    ...(order.discountCents > 0 ? [`Discount: -${formatUSD(order.discountCents)}`] : []),
    `Delivery: ${order.deliveryFeeCents === 0 ? "Free" : formatUSD(order.deliveryFeeCents)}`,
    `Total: ${formatUSD(order.totalCents)}`,
  ].join("\n");
}

export function customerConfirmation(order: EmailOrder, ctx: EmailContext) {
  const trackUrl = `${ctx.webOrigin}/track?number=${encodeURIComponent(order.number)}`;
  const firstName = order.customerName.split(" ")[0] ?? order.customerName;
  const payLine =
    order.paymentMethod === "COD"
      ? `You'll pay ${formatUSD(order.totalCents)} in cash when it arrives.`
      : `Your payment of ${formatUSD(order.totalCents)} by ${PAYMENT_METHOD_LABELS[order.paymentMethod]} went through.`;

  const html = layout(
    ctx,
    `<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${accent};">Order ${escape(order.number)}</p>
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;">Thank you, ${escape(firstName)}.</h1>
<p style="margin:0 0 12px;">We're preparing your order with the brands. We'll call or message you on ${escape(formatLebanesePhone(order.phone))} to confirm delivery. ${payLine}</p>
${itemsTable(order)}
<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B635A;">Delivering to</p>
<p style="margin:0 0 20px;">${escape(order.address)}<br>${escape(order.city)}, ${escape(order.region)}</p>
<p style="margin:0 0 20px;"><a href="${trackUrl}" style="display:inline-block;padding:12px 20px;background:${ink};color:#FFFFFF;text-decoration:none;font-size:14px;">Track your order</a></p>
<p style="margin:0;font-size:13px;color:#6B635A;">${questionsHtml(ctx)}</p>`,
  );

  const text = `Thank you, ${firstName}.

Order ${order.number}
We're preparing your order with the brands. We'll call or message you on ${formatLebanesePhone(order.phone)} to confirm delivery. ${payLine}

${itemsText(order)}

Delivering to:
${order.address}
${order.city}, ${order.region}

Track your order: ${trackUrl}

${questionsText(ctx)}

${textFooter(ctx)}`;
  return { subject: `Your ${ctx.storeName} order ${order.number}`, html, text };
}

/** "Nawl Studio delivers its own items (delivery fee $3)." One line per brand. */
const brandDeliveryLines = (order: EmailOrder) =>
  order.brandDeliveries.map((d) => `${d.brandName} delivers its own items (delivery fee ${formatUSD(d.feeCents)}).`);

export function adminNewOrder(order: EmailOrder, ctx: EmailContext, adminUrl: string) {
  const brandLines = brandDeliveryLines(order);
  const html = layout(
    ctx,
    `<h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;">New order ${escape(order.number)}</h1>
<p style="margin:0 0 4px;"><strong>${escape(order.customerName)}</strong>, ${escape(formatLebanesePhone(order.phone))}${order.email ? `, ${escape(order.email)}` : ""}</p>
<p style="margin:0 0 4px;">${escape(order.address)}, ${escape(order.city)}, ${escape(order.region)}</p>
<p style="margin:0 0 12px;">Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
${order.notes ? `<p style="margin:0 0 12px;padding:10px;border:1px solid ${line};">Note: ${escape(order.notes)}</p>` : ""}
${brandLines.length ? `<p style="margin:0 0 12px;padding:10px;border:1px solid ${accent};">${brandLines.map(escape).join("<br>")}<br>Let them know about this order so they can deliver their items.</p>` : ""}
${itemsTable(order)}
<p style="margin:0;"><a href="${adminUrl}" style="display:inline-block;padding:12px 20px;background:${ink};color:#FFFFFF;text-decoration:none;font-size:14px;">Open in admin</a></p>`,
  );
  const text = `New order ${order.number}
${order.customerName}, ${formatLebanesePhone(order.phone)}${order.email ? `, ${order.email}` : ""}
${order.address}, ${order.city}, ${order.region}
Payment: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}
${order.notes ? `Note: ${order.notes}\n` : ""}${brandLines.length ? `${brandLines.join("\n")}\nLet them know about this order so they can deliver their items.\n` : ""}
${itemsText(order)}

${adminUrl}

${textFooter(ctx)}`;
  return { subject: `New order ${order.number}: ${formatUSD(order.totalCents)}`, html, text };
}
