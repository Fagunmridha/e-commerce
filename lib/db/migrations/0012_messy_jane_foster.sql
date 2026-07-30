ALTER TABLE "products" ADD COLUMN "highlights" jsonb;--> statement-breakpoint
-- products.colors: [{ en, bn }]  ->  [{ name: { en, bn }, hex? }]
--
-- Hand-written: Drizzle emits no SQL for a `$type<>` change, so `db:generate`
-- produced only the ADD COLUMN above. `hex` is not invented here — it stays
-- absent until an admin fills it in, and the UI falls back to a text pill.
--
-- Four guards, each load-bearing:
--
--   EXISTS(... NOT jsonb_exists(elem,'name'))
--     The re-run guard. Already-reshaped rows are not selected at all, so a
--     replay is a genuine no-op. It also saves `colors = '[]'`: jsonb_agg over
--     zero rows returns NULL, so without this an empty array would silently
--     become SQL NULL.
--
--   CASE ... per element
--     A partially reshaped array — an interrupted earlier attempt, or a product
--     saved through the new admin form mid-rollout — has mixed elements. The
--     decision is per element, so an already-wrapped one passes through
--     byte-identical instead of becoming {"name":{"name":...}}.
--
--   jsonb_typeof(...) = 'array'
--     jsonb_array_elements RAISES on a scalar or object. That error does not
--     match /already exists/i, so lib/db/migrate.ts would abort the whole run
--     before reaching any later file. This also covers a row holding
--     'null'::jsonb, which passes IS NOT NULL but has jsonb_typeof = 'null'.
--
--   WITH ORDINALITY + ORDER BY
--     jsonb_agg has no guaranteed input order in a subquery, and the order is
--     semantically significant: colors[0] is the default colour that quick-add
--     ships, and selectedColorIndex is positional.
--
-- `jsonb_exists(x,'name')` rather than the `x ? 'name'` operator: the statement
-- is handed to sql.query(), which also accepts $n placeholders, so a bare `?`
-- is worth avoiding.
UPDATE "products" AS p
SET "colors" = (
      SELECT jsonb_agg(
               CASE
                 WHEN jsonb_typeof(c.elem) = 'object'
                      AND NOT jsonb_exists(c.elem, 'name')
                   THEN jsonb_build_object('name', c.elem)
                 ELSE c.elem
               END
               ORDER BY c.ord
             )
      FROM jsonb_array_elements(p."colors") WITH ORDINALITY AS c(elem, ord)
    )
WHERE p."colors" IS NOT NULL
  AND jsonb_typeof(p."colors") = 'array'
  AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(p."colors") AS e(elem)
        WHERE jsonb_typeof(e.elem) = 'object'
          AND NOT jsonb_exists(e.elem, 'name')
      );
