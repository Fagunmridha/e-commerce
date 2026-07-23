# Setup — Database, Auth & Admin

The store now runs on a real database (Neon + Drizzle) with Clerk auth. Follow
these steps once to bring it online. Nothing is mocked — every page reads the DB.

## 1. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- **`DATABASE_URL`** — create a free Postgres database at https://neon.tech,
  then copy the **pooled** connection string (ends with `-pooler...`).
- **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** and **`CLERK_SECRET_KEY`** — from
  https://dashboard.clerk.com → your app → **API Keys**.
- **`CLERK_WEBHOOK_SIGNING_SECRET`** — see step 4.
- **`NEXT_PUBLIC_SITE_URL`** — your production URL (used by sitemap/robots).
  Optional in dev.

## 2. Create the tables and seed the catalogue

```bash
pnpm db:migrate   # create all 7 tables in Neon (over Neon's HTTP driver)
pnpm db:seed      # load the 16 starter products + 4 categories
```

> **Use `pnpm db:migrate`, not `pnpm db:push`.** `db:push` uses drizzle-kit's
> WebSocket connection to Neon, which hangs on many networks ("Pulling schema
> from database…" then fails). `db:migrate` applies the generated SQL over the
> same HTTP driver the app uses, so it works wherever the app works. It is
> safe to re-run.

If you change the schema later: `pnpm db:generate` (writes new SQL) then
`pnpm db:migrate` again.

## 3. Run the app

```bash
pnpm dev
```

Sign up at `/sign-up`. Your account is created in the `users` table with role
`customer`.

## 4. Clerk webhook (keeps `users` in sync)

In the Clerk dashboard → **Webhooks** → add an endpoint:

- URL: `https://YOUR_DOMAIN/api/webhooks/clerk` (use an ngrok/tunnel URL in dev)
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** into `CLERK_WEBHOOK_SIGNING_SECRET`.

> Not strictly required in local dev — `lib/auth.ts` also creates the user row
> on first request as a fallback. The webhook matters in production.

## 5. Make yourself an admin

Two options:

**A. Drizzle Studio / Neon SQL** — set your row's `role` to `admin`:

```sql
update users set role = 'admin' where email = 'you@example.com';
```

**B.** Once you are admin, go to `/admin/users` and promote/demote anyone with
the **Make admin / Make customer** button.

Then visit `/admin` for the dashboard:

- **Products** — create / edit / delete, manage stock
- **Orders** — see every order, change status (pending → delivered)
- **Users** — change roles

## What changed

- `lib/db/` — Drizzle schema, client, migrations, seed
- `lib/products.ts`, `lib/orders.ts`, `lib/reviews.ts` — DB data layer
- `components/catalogue-provider.tsx` — hydrates client components from the DB
- `middleware.ts`, `lib/auth.ts`, `app/sign-in`, `app/sign-up`, Clerk webhook
- `app/admin/**` — admin dashboard
- `app/actions/**` — server actions (place order, submit review, admin ops)
- Search box, real reviews, real order history, sitemap/robots — all live

## Still to do later (out of scope this round)

- Payment gateway (SSLCommerz / bKash) — checkout currently records the order
  with the chosen method; COD works, online payment is not yet processed.
- Image uploads (Cloudinary / UploadThing) — product images are URLs for now.
