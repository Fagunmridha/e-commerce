import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
import { CatalogNodePanel, CreateTypeForm } from '@/components/admin/wholesale/catalog-node-panel'
import { CatalogTree } from '@/components/admin/wholesale/catalog-tree'
import { nodeName } from '@/components/admin/wholesale/catalog-helpers'
import {
  getWholesaleNode,
  getWholesaleTree,
  type WholesaleNodeDetail,
  type WholesaleNodeKind,
  type WholesaleTreeType,
} from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

const KINDS: readonly WholesaleNodeKind[] = ['type', 'category', 'catalogue']
const CATALOG_HOME = '/admin/wholesale/catalog'

/**
 * One node selected — the tree on the left, and on the right the panel for that
 * row: its numbers, rename / switch off / delete, and the form that adds the
 * next level down (a trade line takes a category, a category takes a
 * catalogue, a catalogue is the leaf).
 *
 * Addressed by `[kind]/[slug]` rather than a single `[node]` segment because
 * slugs are free-form and a trade line called "new" would collide with the
 * create route. `new` is also refused as a slug on write.
 */
export default async function WholesaleNodePage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>
}) {
  const { kind, slug } = await params
  if (!KINDS.includes(kind as WholesaleNodeKind)) notFound()

  if (slug === 'new') {
    // Only a trade line is created from scratch. A category or a catalogue is
    // added from the panel of the node it goes under, so there is no
    // standalone form for them — send the URL somewhere useful.
    if (kind !== 'type') redirect(CATALOG_HOME)
    return <NewTypePage />
  }

  const [tree, node] = await Promise.all([
    getWholesaleTree(),
    getWholesaleNode(kind as WholesaleNodeKind, slug),
  ])
  if (!node) notFound()

  return (
    <div className="space-y-6">
      {/* The header crumb otherwise shows the raw slug. */}
      <SetBreadcrumbLabel label={nodeName(node.row.name)} />

      <PageHeading>
        <Crumbs trail={trailFor(tree, node)} />
      </PageHeading>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CatalogTree tree={tree} active={{ kind: node.kind, slug: node.row.slug }} />
        <CatalogNodePanel node={node} />
      </div>
    </div>
  )
}

async function NewTypePage() {
  const tree = await getWholesaleTree()

  return (
    <div className="space-y-6">
      <PageHeading>
        <Crumbs trail={[{ label: 'New trade line' }]} />
      </PageHeading>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CatalogTree tree={tree} />
        <CreateTypeForm />
      </div>
    </div>
  )
}

function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        Manage wholesale catalog
      </h1>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

type Crumb = { label: string; href?: string }

/**
 * The trail above the panel, resolved from the loaded tree rather than the URL:
 * what a parent slug *is* matters, not what the address says. A parent that is
 * not in the tree (a category under a line that is shop-only) falls back to its
 * slug so the trail still has the right shape.
 */
function trailFor(tree: WholesaleTreeType[], node: WholesaleNodeDetail): Crumb[] {
  const root: Crumb = { label: 'Wholesale catalog', href: CATALOG_HOME }
  const current: Crumb = { label: nodeName(node.row.name) }

  if (node.kind === 'type') return [root, current]

  if (node.kind === 'category') {
    const parent = node.row.parentSlug
    const line = tree.find((type) => type.slug === parent)
    return [
      root,
      ...(parent
        ? [
            {
              label: line ? nodeName(line.name) : parent,
              href: `${CATALOG_HOME}/type/${parent}`,
            },
          ]
        : []),
      current,
    ]
  }

  const line = tree.find((type) =>
    type.children.some((category) => category.slug === node.row.categorySlug),
  )
  return [
    root,
    ...(line
      ? [{ label: nodeName(line.name), href: `${CATALOG_HOME}/type/${line.slug}` }]
      : []),
    {
      label: nodeName(node.row.parentCategoryName),
      href: `${CATALOG_HOME}/category/${node.row.categorySlug}`,
    },
    current,
  ]
}

function Crumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, index) => (
          <li key={`${index}-${crumb.label}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="capitalize hover:text-foreground hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="capitalize text-foreground">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
