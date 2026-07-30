/**
 * Placeholder for any product-grid route (shop, the category pages) while the
 * server renders. Shared so every one of those routes can hand it straight
 * back from its `loading.tsx` and the transition looks the same everywhere.
 */
export function CatalogueSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <>
      <div className="h-48 w-full animate-pulse bg-muted sm:h-60" />

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-4">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-16 animate-pulse rounded-full bg-muted"
              />
            ))}
          </div>
          <div className="h-9 w-36 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
