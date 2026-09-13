CREATE TABLE "attribute_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_slug" text NOT NULL,
	"key" text NOT NULL,
	"label" jsonb NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"required" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_attribute_values" (
	"product_id" text NOT NULL,
	"definition_id" uuid NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "product_attribute_values_product_id_definition_id_pk" PRIMARY KEY("product_id","definition_id")
);
--> statement-breakpoint
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_scope_slug_categories_slug_fk" FOREIGN KEY ("scope_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_definition_id_attribute_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_definitions_scope_key_idx" ON "attribute_definitions" USING btree ("scope_slug","key");--> statement-breakpoint
CREATE INDEX "attribute_definitions_scope_position_idx" ON "attribute_definitions" USING btree ("scope_slug","position");--> statement-breakpoint
CREATE INDEX "product_attribute_values_definition_idx" ON "product_attribute_values" USING btree ("definition_id");