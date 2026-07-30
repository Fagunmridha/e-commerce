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

## 6. Image uploads (Cloudflare R2)

Images live in R2 rather than Vercel Blob: R2's free tier permits commercial
use and charges nothing for egress, which is most of what a product catalogue
costs. Vercel's Hobby plan is [non-commercial only](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage).

In the Cloudflare dashboard:

1. **R2 → Create bucket** — call it `cp-market`.
2. **R2 → Manage API tokens → Create API token** — *Object Read & Write*,
   scoped to that one bucket. Copy the Access Key ID and Secret Access Key.
3. **Bucket → Settings → CORS policy** — without this, browser uploads fail
   even though the presigned URL is perfectly valid:

   ```json
   [{
     "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
     "AllowedMethods": ["PUT"],
     "AllowedHeaders": ["Content-Type"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3600
   }]
   ```

4. **Bucket → Settings → Public access** — enable the `r2.dev` URL and put it
   in `R2_PUBLIC_URL`.

Fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET` and `R2_PUBLIC_URL` (see `.env.example`).

The picker uploads straight from the browser to R2 with a presigned PUT minted
by `app/api/upload/route.ts` — the bytes never cross a route handler, which on
Vercel would cap out around 4.5 MB. That route is also the only auth gate:
`wholesale-products/` and `wholesale-documents/` are open to any signed-in user,
every other folder is admin-only. Both have to be, and not just approved
wholesalers: an applicant uploads their trade licence *before* anyone can approve
them. The 5 MB and image-type caps are what keep that from being a file host.

> **Before going live**, move your domain's nameservers to Cloudflare and add
> `img.your-domain.com` as a custom domain on the bucket, then change
> `R2_PUBLIC_URL` to it. Cloudflare supports `r2.dev` for development only — it
> is rate-limited. Putting DNS on Cloudflare does not affect hosting on Vercel:
> add Vercel's records in Cloudflare DNS with the proxy turned off.

Without the credentials, uploads fail but the picker's **Paste a URL instead**
field still works — that is how the seed catalogue's Unsplash images got there.

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
- Image optimisation — `next.config.mjs` still sets `images.unoptimized: true`,
  so uploads are served at full weight. Narrowing `remotePatterns` and turning
  optimisation on has to happen together (the `**` wildcard is only safe while
  Next never fetches these URLs server-side).
- Media library (`/admin/media`) — nothing sweeps up objects orphaned by an
  image replacement yet; `ListObjectsV2` against the R2 bucket would power it.
