# Lately Lebanon

A curated online shop for small Lebanese makers. The storefront runs on `latelylebanon.com`, the API on `api.latelylebanon.com`, and the team manages everything from the admin panel at `latelylebanon.com/admin`.

## What's in this repo

```
latelylebanon/
├─ shared/   Zod schemas, types and helpers used by both apps (money, Lebanese phone numbers)
├─ api/      Node.js + Express + Prisma + MySQL
│  ├─ prisma/          schema, migrations, seed script and seed artwork
│  └─ src/
│     ├─ services/     all business logic, as plain modules with no Express code
│     ├─ payments/     PaymentProvider interface: cash on delivery, card (MPGS), Whish
│     ├─ storage/      image storage: local disk or S3 compatible (Cloudflare R2)
│     ├─ email/        order emails through SMTP
│     ├─ http/         Express app, routes and middleware
│     └─ tests/        unit tests
└─ web/      Next.js (App Router) + Tailwind: the storefront and the admin panel
```

The business logic in `api/src/services` doesn't depend on Express. If Hostinger only allows one Node app, those services can be called from Next.js route handlers instead (see "If you can only run one Node app" below).

## Requirements

- Node.js 20.11 or newer (22 recommended, see `.nvmrc`)
- MySQL 8

## Local setup

1. Install everything from the repo root:

   ```bash
   npm install
   ```

2. Create a database:

   ```sql
   CREATE DATABASE latelylebanon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Copy the example env files and fill them in:

   ```bash
   cp api/.env.example api/.env
   cp web/.env.example web/.env.local
   ```

   In `api/.env`, set at least `DATABASE_URL`, `CRON_SECRET`, `REVALIDATE_SECRET` and the `SEED_OWNER_*` lines. Use the same `REVALIDATE_SECRET` in `web/.env.local`. To make a long random secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Create the tables and load the sample shop (4 makers, 5 categories, 20 products, delivery areas, the `WELCOME10` promo code and the first owner account):

   ```bash
   npm run db:deploy -w api
   npm run db:seed -w api
   ```

   The seed renders placeholder product photos into `UPLOAD_DIR` (by default an `uploads` folder next to the repo). It only adds the sample shop when there are no brands yet, so running it again is safe.

## Running both apps

In two terminals:

```bash
npm run dev:api    # API on http://localhost:4000
npm run dev:web    # Storefront on http://localhost:3000, admin on http://localhost:3000/admin
```

Log in to the admin with `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` from `api/.env`.

Without `SMTP_HOST`, order emails are printed in the API terminal instead of being sent.

### Tests and checks

```bash
npm test           # checkout totals, promo codes, stock, commission snapshots, brand balances, phone numbers
npm run typecheck  # all three packages
```

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run db:migrate -w api` | Create a new migration after editing `schema.prisma` (development) |
| `npm run db:deploy -w api` | Apply migrations (production and local) |
| `npm run db:seed -w api` | Seed the owner account and sample shop |
| `npm run db:studio -w api` | Browse the database in Prisma Studio |
| `npm run build:api` / `npm run build:web` | Production builds |

## How it fits together

- **Prices are never trusted from the browser.** The bag and checkout ask the API for a quote, and the API recalculates every price, discount and delivery fee when the order is placed.
- **Stock** is checked and decremented in the same database transaction that creates the order. Two people can't buy the last item.
- **Commission** is copied onto each order item at purchase time. Changing a brand's commission later never changes old orders or balances.
- **Brand balances** count delivered orders only. Cancelled and returned orders don't count.
- **Cancelled orders** put their stock back automatically. Returned orders don't, because returned items may not be sellable: update stock by hand if they are.
- **Images** are resized on upload to WebP at 400, 800 and 1600 px. The original is discarded. The storefront picks the right size for each screen, so the server never re-encodes images.
- **Caching:** storefront pages read the API through Next.js' data cache. When someone saves something in the admin, the API calls `web/api/revalidate` and the affected pages refresh within seconds. Most visits never reach the API or the database.
- **Admin sessions** are stored in MySQL (no Redis needed) and sent as an httpOnly cookie. Every change also needs the session's CSRF token.

## Deploying to Hostinger

The plan is shared hosting with managed Node.js apps. The setup below uses two Node apps (`web` and `api`) from the same GitHub repository.

### 1. DNS and SSL

- `latelylebanon.com` points to the **web** app.
- Create the subdomain `api.latelylebanon.com` and point it to the **api** app.
- Turn on the free SSL certificate for both. Everything must run on HTTPS: the admin cookie is marked Secure in production.

### 2. Database

1. In hPanel, go to **Databases > MySQL Databases** and create one database and one user.
2. Build the connection string. Keep `connection_limit` small: the plan allows 75 connections in total, and each app keeps its own pool.

   ```
   mysql://USER:PASSWORD@HOST:3306/DATABASE?connection_limit=5
   ```

   Use `127.0.0.1` as the host. The database only accepts connections from inside the hosting account, so the external host name shown on the database page (`srvXXXX.hstgr.io`) is refused. Use a password with letters and numbers only, or URL-encode any symbols (`@` becomes `%40`).

### 3. The API app

Create a Node.js app connected to the GitHub repo with these settings:

| Setting | Value |
| --- | --- |
| Node version | 22 |
| Framework preset | Other |
| Root directory | `./` |
| Build command | `npm run build:api` |
| Entry file | `api/dist/server.js` |

Add `NPM_CONFIG_INCLUDE=dev` to the environment variables: the build needs Prisma, TypeScript and tsup, which npm would otherwise skip once `NODE_ENV=production` is set.

Environment variables (see `api/.env.example` for every option):

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `TZ` | `Asia/Beirut` |
| `DATABASE_URL` | the connection string from step 2 |
| `WEB_ORIGIN` | `https://latelylebanon.com` |
| `API_ORIGIN` | `https://api.latelylebanon.com` |
| `COOKIE_DOMAIN` | `.latelylebanon.com` |
| `UPLOAD_DRIVER` | `local` |
| `UPLOAD_DIR` | a folder **outside** the app folder, for example `/home/u123456789/latelylebanon-uploads` |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` / `SMTP_SECURE` | `465` / `true` |
| `SMTP_USER` / `SMTP_PASS` | the `orders@latelylebanon.com` mailbox and its password |
| `MAIL_FROM` | `Lately Lebanon <orders@latelylebanon.com>` |
| `ADMIN_NOTIFY_EMAIL` | `orders@latelylebanon.com` |
| `CRON_SECRET` | a long random string |
| `REVALIDATE_URL` | `https://latelylebanon.com/api/revalidate` |
| `REVALIDATE_SECRET` | a long random string, the same one as in the web app |
| `SEED_OWNER_NAME` / `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` | the first owner account |
| `SEED_SAMPLE_CATALOG` | `false`, so the live shop starts without sample products |

**Why `UPLOAD_DIR` must be outside the app folder:** each deploy replaces the app folder. Photos kept inside it would be deleted. Create the folder once over SSH (`mkdir -p ~/latelylebanon-uploads`).

The plan has 50 GB and 600,000 files. Each photo uses 3 files. If space gets tight, switch to Cloudflare R2: set `UPLOAD_DRIVER=s3`, the `S3_*` variables and `UPLOADS_PUBLIC_URL`, and copy the existing uploads folder into the bucket.

Create two separate mailboxes in hPanel under **Emails** before the first order: `orders@latelylebanon.com` sends order emails and receives new-order alerts and customer replies, and `info@latelylebanon.com` is the public contact address for general questions (set it under Admin > Homepage and shop > Contact email).

### 4. Database migrations

Run migrations once before the first start, and after every deploy that changes `api/prisma/schema.prisma`. Pick one of these:

- **Over SSH** (recommended, you stay in control):

  ```bash
  cd ~/path-to-the-api-app
  npm run db:deploy -w api
  npm run db:seed -w api     # first deploy only: creates the owner account (and sample shop if empty)
  ```

- **As part of the build:** change the build command to `npm run build:api && npm run db:deploy -w api`. Migrations then run on every deploy. `prisma migrate deploy` only applies new migrations, so this is safe to repeat.

To start the live shop without the sample makers and products, set `SEED_SAMPLE_CATALOG=false` before running the seed. It then creates only the owner account and default settings.

### 5. The web app

Create a second Node.js app from the same repo:

| Setting | Value |
| --- | --- |
| Node version | 22 |
| Framework preset | Other (the Next.js preset expects a single-app repo) |
| Root directory | `./` |
| Build command | `npm run build` (the root `build` script builds the storefront) |
| Entry file | `web/server.mjs` |

Environment variables:

| Variable | Production value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://latelylebanon.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.latelylebanon.com` |
| `REVALIDATE_SECRET` | the same value as in the API |
| `NODE_ENV` | `production` |
| `NPM_CONFIG_INCLUDE` | `dev` |

`NEXT_PUBLIC_*` values are baked in at build time: redeploy the web app after changing them. The web build doesn't need the API to be running. Pages render on request and are cached.

### 6. Cron jobs

In hPanel, go to **Advanced > Cron Jobs** and add:

| Every | Command |
| --- | --- |
| 5 minutes | `curl -fsS -X POST -H "X-Cron-Secret: YOUR_CRON_SECRET" https://api.latelylebanon.com/cron/expire-unpaid-orders` |
| day (for example 04:00) | `curl -fsS -X POST -H "X-Cron-Secret: YOUR_CRON_SECRET" https://api.latelylebanon.com/cron/purge-sessions` |

The first one cancels card and Whish orders that weren't paid within 30 minutes and puts their stock back. The second removes expired admin logins.

### 7. Check it works

- `https://api.latelylebanon.com/health` returns `{"ok":true}`
- The home page loads with products
- You can log in at `https://latelylebanon.com/admin`
- Saving a product in the admin shows the change on the website within a few seconds

### Payments

Cash on delivery is always on. Card and Whish each have a switch in the API's env vars, and checkout only shows the methods that are switched on and fully configured.

**How an online payment works**

1. At checkout the order is created as "Waiting for payment" and its stock is held.
2. The customer is sent to the bank's or Whish's own page to pay. Card details never reach our servers.
3. When they come back, or when the provider calls our webhook, the API asks the provider directly whether the order was paid, for the right amount and in USD. Only that server to server answer marks an order as paid. The redirect and the webhook body are never trusted on their own.
4. A failed payment cancels the order and releases the stock straight away. An order that's still unpaid after 30 minutes is checked once more with the provider, then cancelled by the cron job.
5. The customer and our team get the order emails once payment is confirmed.

**Visa and Mastercard (Areeba or another bank on MPGS)**

| Variable | Value |
| --- | --- |
| `PAYMENT_CARD_ENABLED` | `true` |
| `MPGS_GATEWAY_URL` | the gateway address the bank gives you |
| `MPGS_MERCHANT_ID` / `MPGS_API_PASSWORD` | from the bank's merchant portal |
| `MPGS_API_VERSION` | the API version the bank supports |
| `MPGS_WEBHOOK_SECRET` | the notification secret from the merchant portal |

In the merchant portal, set the webhook URL to `https://api.latelylebanon.com/payments/card/webhook`. Customers return to `https://api.latelylebanon.com/payments/card/return`.

**Whish**

| Variable | Value |
| --- | --- |
| `PAYMENT_WHISH_ENABLED` | `true` |
| `WHISH_API_URL` | the API address Whish gives you (sandbox first) |
| `WHISH_CHANNEL` / `WHISH_SECRET` | your merchant credentials |
| `WHISH_WEBSITE_URL` | `latelylebanon.com` |

Whish calls `https://api.latelylebanon.com/payments/whish/callback` and sends customers back through `/payments/whish/return`.

Both integrations follow each provider's standard merchant API, and the code that reads their answers is covered by tests. Before going live, confirm the exact endpoints and field names with the bank and with Whish, and place a few test payments in their sandbox. The code to adjust is in `api/src/payments/card.ts` and `api/src/payments/whish.ts`.

### Backups and restoring

Hostinger takes daily backups automatically, and you can make one on demand in hPanel under **Files > Backups**. To restore:

- **Database:** Backups > Databases, pick the date and restore the `latelylebanon` database.
- **Photos:** Backups > Files, restore the `UPLOAD_DIR` folder.

Restore both from the same day so orders and photos match.

### If you can only run one Node app

All business logic lives in `api/src/services` and doesn't import Express. To merge the API into Next.js: add route handlers under `web/src/app/api/...` that validate input with the same `shared` schemas and call the same service functions, point `NEXT_PUBLIC_API_URL` at the web domain, and serve uploads from Next or switch to the S3 driver. The cookie, CSRF and rate limit middleware would move into small helpers used by those handlers.

## How to add a product

This part is for whoever runs the shop day to day. You don't need any technical knowledge.

1. Go to **latelylebanon.com/admin** and log in.
2. Make sure the maker exists: click **Brands** in the menu. If they're not in the list, click **Add a brand**, fill in their name, their story and our commission, add their logo and a cover photo, and click **Add brand**.
3. Click **Products** in the menu, then **Add a product**.
4. **Basics:** type the product name, choose the brand and the category, and write a short description. Two or three short paragraphs is plenty.
5. **Price:** type the price in dollars. Only fill in "Old price" when the product is on sale: it shows crossed out next to the new price.
6. **Photos:** click **Choose photos** or drag photos from your computer onto the box. You can add several at once. The first photo is the one people see in the shop. Drag photos to change the order, or use the arrows under each photo on a phone.
7. **Sizes and colours:**
   - If the product comes in one version, just type how many you have.
   - If it comes in sizes or colours, click **Add sizes or colours**. Name the option (for example Size), then type each choice and press Enter after each one (S, M, L). A table appears with one row per choice: type how many of each you have. Leave the price empty to use the main price, or type a different price for that row.
8. Look at the **Preview** on the right (or at the bottom on a phone) to see how the product will look in the shop.
9. When you're ready for customers to see it, turn on **Show on website**. Leave it off to save it as hidden and finish later.
10. Click **Add product**. You'll see "Product added".

A few more things:

- **Change stock or price later:** click the product in the list, change the numbers and click **Save changes**.
- **A similar product:** open an existing one and click **Duplicate**. The copy starts hidden with zero stock.
- **Take a product off the shop:** turn off **Show on website**, or click **Archive** if it's gone for good. Archived products stay in old orders.
- **Advanced** (closed by default) has the web address, Google title and description, tags, stock codes and a commission just for this product. You can ignore it: everything there fills in on its own.
- Red messages under a field tell you what to fix before saving.
