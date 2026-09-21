import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import type {
  WholesaleNodeKind,
  WholesaleTreeType,
} from '@/lib/wholesale/dashboard'
import { nodeName } from './catalog-helpers'

/**
 * The wholesale catalog tree — trade lines, their categories, and the
 * catalogues under each — as a link list. A server component: selecting a row
 * is a navigation, so it needs no client state, and the row being edited is
 * marked from the URL by the page that renders this.
 */
export function CatalogTree({
  tree,
  active,
}: {
  tree: WholesaleTreeType[]
  /** The node open on the right, so its row can be highlighted. */
  active?: { kind: WholesaleNodeKind; slug: string }
}) {
  const isActive = (kind: WholesaleNodeKind, slug: string) =>
    active?.kind === kind && active.slug === slug

  return (
    <nav
      aria-label="Wholesale catalog"
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="mb-2 flex items-center justify-between px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trade lines
        </h2>
        <Link
          href="/admin/wholesale/catalog/type/new"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <Plus className="size-3.5" aria-hidden />
          New
        </Link>
      </div>

      {tree.length === 0 ? (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          No trade lines yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {tree.map((line) => (
            <li key={line.slug}>
              <TreeRow
                href={`/admin/wholesale/catalog/type/${line.slug}`}
                label={nodeName(line.name)}
                inactive={line.status === 'inactive'}
                active={isActive('type', line.slug)}
              />
              {line.children.length > 0 && (
                <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                  {line.children.map((category) => (
                    <li key={category.slug}>
                      <TreeRow
                        href={`/admin/wholesale/catalog/category/${category.slug}`}
                        label={nodeName(category.name)}
                        inactive={category.status === 'inactive'}
                        active={isActive('category', category.slug)}
                        small
                      />
                      {category.catalogues.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                          {category.catalogues.map((catalogue) => (
                            <li key={catalogue.slug}>
                              <TreeRow
                                href={`/admin/wholesale/catalog/catalogue/${catalogue.slug}`}
                                label={nodeName(catalogue.name)}
                                inactive={catalogue.status === 'inactive'}
                                active={isActive('catalogue', catalogue.slug)}
                                small
                                muted
                              />
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
      )}
    </nav>
  )
}

function TreeRow({
  href,
  label,
  inactive,
  active,
  small,
  muted,
}: {
  href: string
  label: string
  inactive?: boolean
  active: boolean
  small?: boolean
  muted?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex items-center gap-2 rounded-md px-2 py-1.5',
        small ? 'text-xs' : 'text-sm font-medium',
        muted && !active && 'text-muted-foreground',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChevronRight
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <span className="truncate capitalize">{label}</span>
      {inactive && (
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
          off
        </span>
      )}
    </Link>
  )
}
