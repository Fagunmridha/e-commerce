ALTER TABLE "order_items" ADD COLUMN "preorder_ships_at" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preorder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preorder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "preorder_ships_at" date;