ALTER TABLE "categories" ADD COLUMN "scope" text DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_slug" text;--> statement-breakpoint
ALTER TABLE "wholesaler_applications" ADD COLUMN "category_slug" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_slug_categories_slug_fk" FOREIGN KEY ("parent_slug") REFERENCES "public"."categories"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_applications" ADD CONSTRAINT "wholesaler_applications_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Shops approved before this column existed picked no trade line, because there
-- was none to pick, and an approved seller cannot resubmit their application to
-- fill one in. Infer it from what they already list, so a column appearing
-- underneath them does not lock them out of their own dashboard.
--
-- COALESCE: a product's category either hangs under a line, or is one itself.
-- A shop with no listings stays null and falls back to "any wholesale
-- category" in app/actions/seller-products.ts until an admin sets it.
UPDATE "wholesaler_applications" a
SET "category_slug" = (
  SELECT COALESCE(c."parent_slug", c."slug")
  FROM "products" p
  JOIN "categories" c ON c."slug" = p."category"
  WHERE p."seller_id" = a."id"
  GROUP BY COALESCE(c."parent_slug", c."slug")
  ORDER BY count(*) DESC, 1 ASC
  LIMIT 1
)
WHERE a."category_slug" IS NULL;