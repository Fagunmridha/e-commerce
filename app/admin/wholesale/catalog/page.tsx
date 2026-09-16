import Link from 'next/link'
import { ChevronRight, FolderTree } from 'lucide-react'
import { getWholesaleTree } from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

/**
 * Wholesale catalog landing page — when no node is selected, the right panel
 * is a guide rather than an empty box.
 */
export default async function WholesaleCatalogPage() {
  const tree = await getWholesaleTree()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manage wholesale catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          Trade lines, the categories filed under each, and the catalogues
          inside them. Anything you create here appears on /wholesale/market and
          in a seller&apos;s product form.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <TreePanel tree={tree} />

        <div className="rounded-lg border border-dashed border-border bg-card p-6">
          <FolderTree className="size-6 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Pick a node on the left</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tree.length === 0
              ? 'No trade lines yet — create the first one to start the tree.'
              : 'Each trade line lists its categories, and each category its catalogues. The right panel shows the row you pick.'}
          </p>
          {tree.length === 0 && (
            <Link
              href="/admin/wholesale/catalog/type/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Create the first trade line
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The left tree, rendered server-side from `getWholesaleTree`. The page itself
 * is server-rendered, so a client island is only needed when a row is being
 * edited — that is the detail panel's job, not the tree's.
 */
function TreePanel({
  tree,
}: {
  tree: Awaited<ReturnType<typeof getWholesaleTree>>
}) {
  if (tree.length === 0) return <div className="text-sm text-muted-foreground" />

  return (
    <nav className="rounded-lg border border-border bg-card p-3">
      <ul className="space-y-1">
        {tree.map((line) => (
          <li key={line.slug}>
            <Link
              href={`/admin/wholesale/catalog/type/${line.slug}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="capitalize">{pickName(line.name)}</span>
              {line.status === 'inactive' && (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  off
                </span>
              )}
            </Link>
            {line.children.length > 0 && (
              <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                {line.children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/admin/wholesale/catalog/category/${child.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted"
                    >
                      <ChevronRight
                        className="size-3 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="capitalize">{pickName(child.name)}</span>
                      {child.status === 'inactive' && (
                        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          off
                        </span>
                      )}
                    </Link>
                    {child.catalogues.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                        {child.catalogues.map((catalogue) => (
                          <li key={catalogue.slug}>
                            <Link
                              href={`/admin/wholesale/catalog/catalogue/${catalogue.slug}`}
                              className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <ChevronRight
                                className="size-3 text-muted-foreground/70"
                                aria-hidden
                              />
                              <span className="capitalize">
                                {pickName(catalogue.name)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Pull the English label out of a localised name. Wholesale admin does not
 * need a Bangla toggle — the form on the right handles both — so the tree
 * just shows the name a reader will recognise.
 */
function pickName(name: { en?: string; bn?: string } | null | undefined): string {
  return name?.en ?? name?.bn ?? ''
}
