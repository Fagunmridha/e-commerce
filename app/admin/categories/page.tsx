import { CategoriesManager } from '@/components/admin/categories-manager'
import { getAdminCategories } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  const categories = await getAdminCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Categories
        </h1>
        <p className="text-muted-foreground">
          The top of the catalogue tree. A category with nothing above it is a
          trade line — Cloth, Electronics — and that is what a wholesaler picks
          when they apply. The categories under it are where products are
          actually filed, and each one can hold catalogues of its own.
        </p>
      </div>
      <CategoriesManager categories={categories} />
    </div>
  )
}
