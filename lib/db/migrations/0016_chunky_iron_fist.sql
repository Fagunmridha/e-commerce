DROP INDEX IF EXISTS "reviews_product_id_idx";--> statement-breakpoint
-- Hand-edited: drizzle generated a single `ADD COLUMN ... DEFAULT 'pending'`,
-- which would have stamped every existing row as pending and dropped every
-- product's star rating to zero on deploy. Those rows predate moderation —
-- each came from a real signed-in customer and is already live on the site
-- (lib/db/seed.ts seeds no reviews) — so the column is added with the *old
-- world's* default, which backfills them to 'approved' without a table
-- rewrite, and the second statement then flips the default so everything
-- submitted from here on starts as 'pending'.
--
-- Expressed as a default-flip rather than `UPDATE reviews SET status =
-- 'approved'` because this is replay-safe: on a re-run the ADD COLUMN throws
-- "already exists", which lib/db/migrate.ts swallows, and SET DEFAULT is
-- idempotent. A bare UPDATE would instead silently approve every review that
-- had since accumulated in the pending queue.
ALTER TABLE "reviews" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reviewed_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_product_id_status_idx" ON "reviews" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "reviews_status_created_at_idx" ON "reviews" USING btree ("status","created_at");