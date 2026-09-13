import { ProductForm } from '@/components/admin/product-form'
import { getActiveCatalogues, getRetailCategories } from '@/lib/products'
import { getAllAttributeDefinitions } from '@/lib/attributes'
import { leafCategories } from '@/lib/category-tree'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const [catalogues, retail, definitions] = await Promise.all([
    getActiveCatalogues(),
    getRetailCategories(),
    getAllAttributeDefinitions(),
  ])
  // House stock goes on the storefront, so it is filed under a browsable
  // category — and under a leaf, never under a trade line.
  const categories = leafCategories(retail)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h2 className="mb-6 text-xl font-bold text-foreground">New product</h2>
      <ProductForm
        categories={categories}
        catalogues={catalogues}
        definitions={definitions}
      />
    </div>
  )
}
