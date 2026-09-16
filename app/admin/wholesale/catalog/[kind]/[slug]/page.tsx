import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, FolderTree } from 'lucide-react'
import {
  getWholesaleNode,
  getWholesaleTree,
  type WholesaleNodeDetail,
  type WholesaleNodeKind,
} from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

const KINDS: readonly WholesaleNodeKind[] = ['type', 'category', 'catalogue']

/**
 * One node selected — the right panel shows its row, the children it has, and
 * a create-child form (a Type page adds a Category; a Category page adds a
 * Catalogue; a Catalogue leaf has nothing underneath to add).
 *
 * The page is selected by `[kind]/[slug]` rather than a single `[node]`
 * segment because slugs contain hyphens and would collide with `new`.
 */
export default async function WholesaleNodePage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>
}) {
  const { kind, slug } = await params
  if (!KINDS.includes(kind as WholesaleNodeKind)) notFound()

  // Slug 'new' is reserved for the create form — see `PlaceholderDetail` below.
  if (slug === 'new') {
    return <NewNodePage kind={kind as WholesaleNodeKind} />
  }

  const [tree, node] = await Promise.all([
    getWholesaleTree(),
    getWholesaleNode(kind as WholesaleNodeKind, slug),
  ])
  if (!node) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manage wholesale catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          {breadcrumbsFor(node).map((crumb, index) => (
            <span key={crumb.href}>
              {index > 0 && (
                <ChevronRight
                  className="mx-1 inline size-3.5 align-middle text-muted-foreground"
                  aria-hidden
                />
              )}
              <Link
                href={crumb.href}
                className="hover:underline hover:text-foreground"
              >
                {crumb.label}
              </Link>
            </span>
          ))}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CatalogTreeNav tree={tree} activeNode={node} />
        <PlaceholderDetail node={node} />
      </div>
    </div>
  )
}

/**
 * The "create a new Type" page — same layout, but the right panel is a
 * create form rather than a row that already exists. Categories and
 * Catalogues can also be created here, but a `Type` must be picked for the
 * first drop-down, so the page starts there.
 */
function NewNodePage({ kind }: { kind: WholesaleNodeKind }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manage wholesale catalog
        </h1>
        <p className="text-sm text-muted-foreground">
          New {kind === 'type' ? 'trade line' : kind}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="px-2 py-4 text-xs text-muted-foreground">
            The tree on the left appears once a node is saved.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-card p-6">
          <FolderTree className="size-6 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">Use the form below</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {kind === 'type'
              ? 'Pick this trade line from the catalogue list above and click edit to rename or toggle it.'
              : 'Use an existing node on the left to add a child from its detail panel.'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Or head back to{' '}
            <Link
              href="/admin/wholesale/catalog"
              className="font-medium text-primary hover:underline"
            >
              the catalog manager
            </Link>{' '}
            to pick an existing one.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Stands in for the row-editor panel this screen was built to show — rename,
 * toggle active/inactive, and a create-child form, all wired up in
 * `lib/wholesale/dashboard.ts` and `app/actions/wholesale-admin.ts`, but never
 * given a UI. Rather than a crash on every visit to this tree, it says plainly
 * what the row is and points at the equivalent screens that already work.
 *
 * `/admin/categories` and `/admin/catalogues` cover the same rows today: this
 * page is a second, tree-shaped way to browse the same data, not a
 * replacement for them. Swap this component out once the real panel exists —
 * nothing else on the page depends on it.
 */
function PlaceholderDetail({ node }: { node: WholesaleNodeDetail }) {
  const label =
    node.kind === 'type'
      ? 'trade line'
      : node.kind === 'category'
        ? 'category'
        : 'catalogue'
  const managePath =
    node.kind === 'catalogue' ? '/admin/catalogues' : '/admin/categories'

  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-6">
      <FolderTree className="size-6 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-lg font-semibold">
        {pickName(node.row.name)}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground capitalize">{label}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        This tree-view detail panel is not built yet. To rename this {label},
        change where it appears, or add a child under it, use{' '}
        <Link
          href={managePath}
          className="font-medium text-primary hover:underline"
        >
          {managePath}
        </Link>{' '}
        for now — it manages the same underlying rows.
      </p>
    </div>
  )
}

/**
 * The left-hand tree, with the open node highlighted. Lives next to the
 * detail page rather than behind a tab so the manager reads as one screen.
 */
function CatalogTreeNav({
  tree,
  activeNode,
}: {
  tree: Awaited<ReturnType<typeof getWholesaleTree>>
  activeNode: NonNullable<Awaited<ReturnType<typeof getWholesaleNode>>>
}) {
  if (tree.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        No trade lines yet.
      </div>
    )
  }

  return (
    <nav className="rounded-lg border border-border bg-card p-3">
      <ul className="space-y-1">
        {tree.map((line) => {
          const lineActive =
            activeNode.kind === 'type' && activeNode.row.slug === line.slug
          return (
            <li key={line.slug}>
              <TreeRow
                href={`/admin/wholesale/catalog/type/${line.slug}`}
                label={pickName(line.name)}
                inactive={line.status === 'inactive'}
                active={lineActive}
              />
              {line.children.length > 0 && (
                <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                  {line.children.map((child) => {
                    const childActive =
                      (activeNode.kind === 'type' &&
                        child.slug === activeNode.row.slug) ||
                      (activeNode.kind === 'category' &&
                        activeNode.row.slug === child.slug)
                    return (
                      <li key={child.slug}>
                        <TreeRow
                          href={`/admin/wholesale/catalog/category/${child.slug}`}
                          label={pickName(child.name)}
                          inactive={child.status === 'inactive'}
                          active={Boolean(childActive)}
                          small
                        />
                        {child.catalogues.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                            {child.catalogues.map((catalogue) => {
                              const catActive =
                                activeNode.kind === 'catalogue' &&
                                activeNode.row.slug === catalogue.slug
                              return (
                                <li key={catalogue.slug}>
                                  <TreeRow
                                    href={`/admin/wholesale/catalog/catalogue/${catalogue.slug}`}
                                    label={pickName(catalogue.name)}
                                    inactive={catalogue.status === 'inactive'}
                                    active={Boolean(catActive)}
                                    small
                                    muted
                                  />
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
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
      className={[
        'flex items-center gap-2 rounded-md px-2 py-1.5',
        small ? 'text-xs' : 'text-sm font-medium',
        muted && 'text-muted-foreground',
        active
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="capitalize">{label}</span>
      {inactive && (
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
          off
        </span>
      )}
    </Link>
  )
}

/**
 * The breadcrumb chain above the detail panel, derived from the loaded node
 * rather than `params` — what the parent slug *resolves to* matters, not what
 * the URL says.
 */
function breadcrumbsFor(
  node: NonNullable<Awaited<ReturnType<typeof getWholesaleNode>>>,
) {
  const root: { label: string; href: string } = {
    label: 'Wholesale catalog',
    href: '/admin/wholesale/catalog',
  }

  if (node.kind === 'type') {
    return [root, { label: pickName(node.row.name), href: '#' }]
  }
  if (node.kind === 'category') {
    return [
      root,
      {
        label: pickName(node.row.parentSlug ?? '') || pickName(node.row.name),
        href: `/admin/wholesale/catalog/type/${node.row.parentSlug ?? ''}`,
      },
      { label: pickName(node.row.name), href: '#' },
    ]
  }
  return [
    root,
    {
      label: '…',
      href: '/admin/wholesale/catalog',
    },
    {
      label: pickName(node.row.parentCategoryName),
      href: `/admin/wholesale/catalog/category/${node.row.categorySlug}`,
    },
    { label: pickName(node.row.name), href: '#' },
  ]
}

function pickName(name: { en?: string; bn?: string } | string | null | undefined): string {
  if (typeof name === 'string') return name
  return name?.en ?? name?.bn ?? ''
}
