-- Hold every product's catalogue to its category at the database.
--
-- Reordered by hand from what drizzle-kit generated, which dropped the old
-- foreign key first, then added the new one before the index it depends on.
-- Postgres refuses a foreign key whose referenced columns have no unique index,
-- and `pnpm db:migrate` sends statements one at a time over Neon's HTTP driver
-- — so that order would have left `products` with neither key if it failed.
-- This order only ever removes the old guard once the new one is in place.
--
-- 1. The (category_slug, slug) pair the new key points at. `slug` is already
--    the primary key, so this cannot fail on existing data.
CREATE UNIQUE INDEX "catalogues_category_slug_pair_idx" ON "catalogues" USING btree ("category_slug","slug");--> statement-breakpoint
-- 2. The composite key. It validates every existing row, so it fails — leaving
--    the old key untouched — if any product is already filed under a catalogue
--    from another category. (Checked before this was written: none are.)
ALTER TABLE "products" ADD CONSTRAINT "products_category_catalogue_fk" FOREIGN KEY ("category","catalogue_slug") REFERENCES "public"."catalogues"("category_slug","slug") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
-- 3. Only now retire the single-column key it supersedes.
ALTER TABLE "products" DROP CONSTRAINT "products_catalogue_slug_catalogues_slug_fk";
