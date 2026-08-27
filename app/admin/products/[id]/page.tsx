import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
import {
  getAdminProductById,
  getAllCatalogues,
  getProductImages,
} from '@/lib/products'

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
  const [images, catalogues] = await Promise.all([
    getProductImages(product),
    getAllCatalogues(),
  ])
  const gallery = images.slice(1)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <SetBreadcrumbLabel label={product.name.en} />
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — {product.name.en}
      </h2>
      <ProductForm product={product} gallery={gallery} catalogues={catalogues} />
    </div>
  )
}
