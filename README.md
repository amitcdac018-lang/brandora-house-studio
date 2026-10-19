# Brandora House Studio

A modern, secure e-commerce website for premium footwear — built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js, and Razorpay.

Brands sold: **Campus**, **Nike**, **Aqualite**, **Action Shoes**.

> **Branding status:** The official Instagram profile (`@brandora_house_studio`) could not be scraped for pixel-accurate assets (logo image, exact brand colors) — automated tools cannot retrieve Instagram's actual media. The site currently ships with a **placeholder premium brand identity** (dark ink / gold / cream palette, wordmark logo). Replace `src/app/globals.css` (CSS variables under "placeholder premium brand palette"), `src/components/layout/brand-logo.tsx`, and `public/favicon.ico` with the real approved assets before launch.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL
- **ORM:** Prisma 6
- **Auth:** Auth.js (NextAuth v5) — credentials provider, JWT sessions, RBAC
- **Validation:** Zod (server-side, on every mutation)
- **Payments:** Razorpay (orders, signature verification, webhooks, refunds)
- **Testing:** Vitest + Testing Library

## Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- npm
- Docker Desktop (recommended, for local PostgreSQL) — or any PostgreSQL 14+ instance
- A Razorpay account (test/sandbox keys are enough for development)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

Required variables (see `.env.example` for the full list and descriptions):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session signing secret — generate with `npx auth secret` |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API credentials (server-side only) |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured on your Razorpay webhook endpoint |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public key id exposed to the Razorpay Checkout widget (never the secret) |
| `CLOUDINARY_*` | Image hosting credentials (or swap for your preferred provider) |

**Never commit `.env` with real credentials.** Only `.env.example` (with placeholders) is tracked in git.

## 3. Start PostgreSQL

Using the provided Docker Compose file (recommended for local development):

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with credentials matching the default `.env.example`.

If you prefer a different setup (local install, Neon, Supabase, RDS, etc.), just point `DATABASE_URL` at it instead.

## 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables (users, brands, products, variants, inventory, carts, orders, payments, refunds, shipping, shipments, audit logs, etc.) per `prisma/schema.prisma`.

## 5. Seed sample data (development only)

```bash
npm run db:seed
```

This creates:
- An admin user: `admin@brandorahousestudio.com` / `Admin@12345`
- A sample customer: `customer@example.com` / `Customer@12345`
- The four brands, sample categories, shipping rules, and several **clearly marked `[SAMPLE]`** products with variants.

**Change or remove these default credentials before production deployment.**

## 6. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Admin dashboard: [http://localhost:3000/admin](http://localhost:3000/admin) (requires the admin account above).

## Running Tests

```bash
npm run test
```

Covers: password hashing, auth validation schemas, rate limiting, Razorpay signature verification (payment + webhook), RBAC guards (`requireUser`/`requireAdmin`), shipping calculation, and cart/checkout input validation.

## Payments: What You Must Configure Before Going Live

1. Create a **live** Razorpay account and generate live API keys (test keys only work in Razorpay's test mode).
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to the live values in your production environment variables (never in code).
3. In the Razorpay dashboard, configure a webhook pointing to `https://yourdomain.com/api/payments/webhook`, subscribed to at least: `payment.captured`, `payment.failed`, `refund.processed`. Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.
4. The app verifies payments two ways: client-side callback (`/api/payments/verify`, for fast UX) and the server-to-server webhook (`/api/payments/webhook`, the authoritative source of truth — processes payments even if the client never calls back, e.g. tab closed mid-payment).
5. Raw card numbers and CVVs are **never** handled or stored by this application — all card entry happens inside Razorpay's hosted Checkout widget.

## Image Hosting

Product images are referenced by URL (see `next.config.ts` → `images.remotePatterns`, currently allowing Cloudinary, Unsplash, and placehold.co). To use Cloudinary in production:

1. Create a Cloudinary account and set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
2. Wire up an upload flow in the admin product form (currently accepts direct image URLs — add a signed-upload endpoint before launch if admins need to upload files directly rather than paste URLs).
3. Validate uploads by file type, size, and content server-side before accepting them (do not trust client-reported MIME type alone).

## Security Notes

- Passwords are hashed with bcrypt (12 rounds); raw passwords are never logged or stored.
- All admin mutations independently call `requireAdmin()` server-side (`src/lib/auth/guards.ts`) — the `src/proxy.ts` route guard is a UX redirect only, **not** the authorization boundary. Never add an admin feature that trusts the UI or proxy alone.
- `src/proxy.ts` replaces the deprecated `middleware.ts` convention in Next.js 16 and protects `/admin/*` and `/account/*` routes.
- Rate limiting is applied to register, login, password reset, and checkout endpoints (`src/lib/rate-limit`). The default implementation is in-memory (fine for a single instance/dev) — swap in Upstash Redis (env vars already present in `.env.example`) for multi-instance production deployments.
- All prices, discounts, stock, and shipping charges are recomputed and validated **server-side** at checkout (`src/lib/actions/checkout.ts`) — client-submitted amounts are never trusted.
- Stock is reserved transactionally at order creation and released automatically if payment fails, preventing overselling and duplicate orders (idempotency keys on every checkout attempt).
- CSRF protection, secure/HTTP-only session cookies, and CSP are provided by Next.js/Auth.js defaults — review and harden further (e.g. a stricter CSP) before production launch.
- Run `npm audit` and keep dependencies current; this project pins Prisma to a stable release (6.19.3) rather than a pre-release.

## Database Schema

See `prisma/schema.prisma` for the full model. Key entities: `User`/`Account`/`Session` (Auth.js), `Brand`, `Category`, `Product`, `ProductVariant`, `InventoryLog`, `Cart`/`CartItem`, `Address`, `Order`/`OrderItem`, `Payment`, `Refund`, `ShippingRule`, `Shipment`, `Banner`, `SiteSetting`, `AuditLog`.

## Deployment

1. Provision a production PostgreSQL database (Neon, Supabase, RDS, etc.) and set `DATABASE_URL`.
2. Run `npx prisma migrate deploy` against production (do **not** use `migrate dev` in production).
3. Set all environment variables from `.env.example` with real, production values in your hosting platform (Vercel, etc.) — never commit them.
4. Configure the Razorpay live webhook as described above.
5. Ensure HTTPS is enforced (standard on Vercel; configure explicitly on other hosts).
6. Point image `remotePatterns` in `next.config.ts` at your actual image CDN domain(s).
7. Replace placeholder branding (logo, colors, favicon) with approved brand assets once available.

## What's Not Yet Wired Up (Needs Manual Configuration)

- **Real brand assets** — placeholder logo/colors/favicon in place; swap once Instagram-sourced or otherwise approved assets are supplied.
- **Transactional email** (order confirmations, password reset emails) — the password-reset endpoint currently logs the reset link to the server console in development; wire up a real email provider (Resend, SendGrid, Postmark, etc.) before launch.
- **Image upload pipeline** — admin product form currently accepts image URLs directly; add a signed Cloudinary (or similar) upload flow for a better admin experience.
- **Production rate-limit store** — swap the in-memory limiter for Upstash Redis (or similar) for correctness across multiple server instances.
- **Legal policy content** — Privacy, Terms, Shipping, Cancellation, and Return policies ship as clearly labeled drafts; have them reviewed by legal counsel before launch.
