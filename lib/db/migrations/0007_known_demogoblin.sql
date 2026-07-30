CREATE TABLE "wholesaler_application_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"product_id" text,
	"name_snapshot" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesaler_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"shop_name" text NOT NULL,
	"business_type" text NOT NULL,
	"tax_token" text,
	"bin_number" text,
	"trade_license_no" text,
	"years_in_business" integer,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"alt_phone" text,
	"email" text NOT NULL,
	"website" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"district" text,
	"postcode" text,
	"trade_license_image" text,
	"shop_photo" text,
	"nid_image" text,
	"monthly_volume" double precision,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wholesaler_applications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_wholesale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "wholesale_price" double precision;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "moq" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "wholesaler_application_items" ADD CONSTRAINT "wholesaler_application_items_application_id_wholesaler_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."wholesaler_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_application_items" ADD CONSTRAINT "wholesaler_application_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_applications" ADD CONSTRAINT "wholesaler_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_applications" ADD CONSTRAINT "wholesaler_applications_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;