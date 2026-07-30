import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { getAdminProductById, getProductImages } from '@/lib/products'

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
  const gallery = (await getProductImages(product)).slice(1)

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — {product.name.en}
      </h2>
      <ProductForm product={product} gallery={gallery} />
    </div>
  )
}
