CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"placement" text DEFAULT 'hero' NOT NULL,
	"image" text NOT NULL,
	"label" jsonb,
	"title" jsonb NOT NULL,
	"highlight" jsonb,
	"subtitle" jsonb,
	"cta_label" jsonb,
	"cta_href" text DEFAULT '/shop' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "banners_slug_unique" UNIQUE("slug")
);
