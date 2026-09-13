import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
import {
  getAdminProductById,
  getActiveCatalogues,
  getProductImages,
  getRetailCategories,
} from '@/lib/products'
import { leafCategories } from '@/lib/category-tree'
import {
  getAllAttributeDefinitions,
  getProductAttributes,
} from '@/lib/attributes'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getAdminProductById(id)
  if (!product) notFound()

  // `getProductImages` returns the primary shot first; the form edits the rest.
  const [images, catalogues, retail, definitions, attributeValues] =
    await Promise.all([
      getProductImages(product),
      getActiveCatalogues(),
      getRetailCategories(),
      getAllAttributeDefinitions(),
      getProductAttributes(id),
    ])
  const gallery = images.slice(1)
  const categories = leafCategories(retail)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <SetBreadcrumbLabel label={product.name.en} />
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — {product.name.en}
      </h2>
      <ProductForm
        product={product}
        gallery={gallery}
        categories={categories}
        catalogues={catalogues}
        definitions={definitions}
        attributeValues={attributeValues}
      />
    </div>
  )
}
