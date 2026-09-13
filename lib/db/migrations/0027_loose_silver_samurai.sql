ALTER TABLE "products" ADD COLUMN "approval_status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_approval_status_idx" ON "products" USING btree ("approval_status");