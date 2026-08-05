ALTER TABLE "orders" ADD COLUMN "advance_amount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "due_amount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_trx_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_sender_phone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "advance_verified_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preorder_advance_pct" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_advance_verified_by_user_id_users_id_fk" FOREIGN KEY ("advance_verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;