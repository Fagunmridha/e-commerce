DROP TABLE "wholesaler_application_items" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "is_wholesale";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "wholesale_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "moq";