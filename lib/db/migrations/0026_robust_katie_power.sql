CREATE TABLE "wholesaler_trade_lines" (
	"application_id" uuid NOT NULL,
	"category_slug" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wholesaler_trade_lines_application_id_category_slug_pk" PRIMARY KEY("application_id","category_slug")
);
--> statement-breakpoint
ALTER TABLE "wholesaler_trade_lines" ADD CONSTRAINT "wholesaler_trade_lines_application_id_wholesaler_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_trade_lines" ADD CONSTRAINT "wholesaler_trade_lines_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wholesaler_trade_lines_category_idx" ON "wholesaler_trade_lines" USING btree ("category_slug");--> statement-breakpoint
-- Backfill the grants every existing shop already has. Without this the join
-- table is empty on the first deploy and `getApplicationLines` falls through to
-- `category_slug` for every shop — correct, but only by accident, and an admin
-- opening the review screen would see no line ticked against a shop that has
-- one. `approved` because these were granted: the column is only ever written
-- by an admin's review, never by the applicant.
INSERT INTO "wholesaler_trade_lines" ("application_id", "category_slug", "status")
SELECT "id", "category_slug", 'approved'
FROM "wholesaler_applications"
WHERE "category_slug" IS NOT NULL
ON CONFLICT DO NOTHING;