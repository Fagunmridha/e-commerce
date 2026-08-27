import { CataloguesManager } from '@/components/admin/catalogues-manager'
import { getAdminCatalogues } from '@/lib/catalogues'
import { getAllCategories } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function CataloguesPage() {
  const [catalogues, categories] = await Promise.all([
    getAdminCatalogues(),
    getAllCategories(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Catalogues
        </h1>
        <p className="text-muted-foreground">
          The second level of the catalogue tree — Jeans and Shirts under Men’s,
          Borka and Saree under Women’s. Shoppers pick one from the dropdown on
          a category page, and sellers file their listings under one.
        </p>
      </div>
      <CataloguesManager catalogues={catalogues} categories={categories} />
    </div>
  )
}
