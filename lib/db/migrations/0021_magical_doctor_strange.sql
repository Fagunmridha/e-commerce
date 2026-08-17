CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_number" text NOT NULL,
	"order_id" uuid NOT NULL,
	"seller_id" uuid,
	"shop_name_snapshot" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gross_amount" double precision NOT NULL,
	"commission_amount" double precision NOT NULL,
	"payout_amount" double precision NOT NULL,
	"commission_pct" integer,
	"piece_count" integer NOT NULL,
	"line_count" integer NOT NULL,
	"settled_at" timestamp,
	"paid_at" timestamp,
	"paid_by_user_id" integer,
	"paid_note" text,
	"voided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_settlement_number_unique" UNIQUE("settlement_number")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "commission_pct" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "commission_pct" integer;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_seller_id_wholesaler_applications_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "settlements_order_seller_idx" ON "settlements" USING btree ("order_id","seller_id");--> statement-breakpoint
CREATE INDEX "settlements_seller_status_idx" ON "settlements" USING btree ("seller_id","status");--> statement-breakpoint
CREATE INDEX "settlements_seller_settled_at_idx" ON "settlements" USING btree ("seller_id","settled_at");--> statement-breakpoint
CREATE INDEX "settlements_status_settled_at_idx" ON "settlements" USING btree ("status","settled_at");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_id_wholesaler_applications_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_seller_id_idx" ON "order_items" USING btree ("seller_id");--> statement-breakpoint
-- Hand-written. Seller attribution used to be a live join through
-- products.seller_id; the column above replaces it. Backfilling is what keeps
-- every shop's existing order history intact when lib/wholesale/orders.ts
-- switches over — without it those pages go blank.
UPDATE "order_items" oi SET "seller_id" = p."seller_id"
FROM "products" p
WHERE p."id" = oi."product_id" AND p."seller_id" IS NOT NULL;--> statement-breakpoint
-- commission_pct is deliberately NOT backfilled. No rate was agreed on those
-- sales, and inventing one retroactively invents a debt. Legacy lines therefore
-- read as 0% through lineCommissionPct(), and no settlement rows exist for
-- orders placed before this migration.