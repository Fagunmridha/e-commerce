CREATE TABLE "catalogues" (
	"slug" text PRIMARY KEY NOT NULL,
	"category_slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catalogue_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wholesale_role" text;--> statement-breakpoint
ALTER TABLE "catalogues" ADD CONSTRAINT "catalogues_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalogues_category_slug_idx" ON "catalogues" USING btree ("category_slug");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_catalogue_slug_catalogues_slug_fk" FOREIGN KEY ("catalogue_slug") REFERENCES "public"."catalogues"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_catalogue_slug_idx" ON "products" USING btree ("catalogue_slug");--> statement-breakpoint
-- Anyone who already applied chose the seller side before the choice existed.
-- Without this they would land on the new chooser and be asked to pick again,
-- and picking "buyer" would strand an approved shop it can no longer reach.
UPDATE "users" SET "wholesale_role" = 'seller' WHERE "id" IN (SELECT "user_id" FROM "wholesaler_applications");