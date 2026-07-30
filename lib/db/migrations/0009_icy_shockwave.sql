CREATE TABLE "wholesaler_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"name" text NOT NULL,
	"image" text NOT NULL,
	"category" text NOT NULL,
	"price" double precision NOT NULL,
	"sizes" text[],
	"stock" integer NOT NULL,
	"product_id" text
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_application_id_wholesaler_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_category_categories_slug_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_wholesaler_applications_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE cascade ON UPDATE no action;