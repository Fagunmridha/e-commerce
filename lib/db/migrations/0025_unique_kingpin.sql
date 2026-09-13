ALTER TABLE "catalogues" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "catalogues" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "catalogues" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "catalogues_category_name_idx" ON "catalogues" USING btree ("category_slug",lower("name"->>'en'));--> statement-breakpoint
CREATE INDEX "categories_parent_position_idx" ON "categories" USING btree ("parent_slug","position");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_parent_name_idx" ON "categories" USING btree (coalesce("parent_slug", ''),lower("name"->>'en'));--> statement-breakpoint
-- Backfill `position` so nothing visibly moves. Until now the order was a
-- hard-coded list in `fetchAllCategories` — the four seeded slugs first, in
-- that order, then everything else alphabetically. This writes exactly that
-- ordering into the column, numbered within each parent, which is what
-- `position` now means.
UPDATE "categories" AS c
SET "position" = v.pos
FROM (
  SELECT
    "slug",
    row_number() OVER (
      PARTITION BY coalesce("parent_slug", '')
      ORDER BY
        CASE "slug"
          WHEN 'men' THEN 0
          WHEN 'women' THEN 1
          WHEN 'kids' THEN 2
          WHEN 'accessories' THEN 3
          ELSE 4
        END,
        "slug"
    ) - 1 AS pos
  FROM "categories"
) AS v
WHERE c."slug" = v."slug";