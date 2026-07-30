DROP TABLE "wholesaler_products" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "moq" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "wholesaler_applications" ADD COLUMN "tax_token_image" text;