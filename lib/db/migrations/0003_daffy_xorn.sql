CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" jsonb,
	"type" text NOT NULL,
	"value" double precision NOT NULL,
	"min_order" double precision DEFAULT 0 NOT NULL,
	"max_discount" double precision,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;