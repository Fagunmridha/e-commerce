import { ProductForm } from '@/components/admin/product-form'
import { getAllCatalogues } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const catalogues = await getAllCatalogues()

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h2 className="mb-6 text-xl font-bold text-foreground">New product</h2>
      <ProductForm catalogues={catalogues} />
    </div>
  )
}
