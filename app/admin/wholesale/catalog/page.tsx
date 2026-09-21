import Link from 'next/link'
import { FolderTree, Plus } from 'lucide-react'
import { CatalogTree } from '@/components/admin/wholesale/catalog-tree'
import { Button } from '@/components/ui/button'
import { getWholesaleTree } from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

/**
 * Wholesale catalog landing page — no node selected, so the right panel is a
 * guide to how the three levels fit together rather than an empty box.
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
        <CatalogTree tree={tree} />

        <div className="min-w-0 rounded-lg border border-border bg-card p-6">
          <FolderTree className="size-6 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">
            {tree.length === 0
              ? 'Start with a trade line'
              : 'Pick a node on the left'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tree.length === 0
              ? 'Nothing is set up yet. Create the first trade line, then add its categories and catalogues.'
              : 'Open a row to rename it, switch it off, or add what goes under it.'}
          </p>

          <ol className="mt-5 space-y-3 text-sm">
            <Step n={1} title="Trade line" example="Cloth">
              What a wholesaler picks when they apply.
            </Step>
            <Step n={2} title="Category" example="Men, Women">
              Sits inside a trade line. Products are filed here.
            </Step>
            <Step n={3} title="Catalogue" example="Jeans, Shirt, Panjabi">
              Sits inside a category. The finest level.
            </Step>
          </ol>

          <Button asChild className="mt-6">
            <Link href="/admin/wholesale/catalog/type/new">
              <Plus className="size-4" aria-hidden />
              New trade line
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function Step({
  n,
  title,
  example,
  children,
}: {
  n: number
  title: string
  example: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <span>
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-muted-foreground"> — e.g. {example}. </span>
        <span className="text-muted-foreground">{children}</span>
      </span>
    </li>
  )
}
