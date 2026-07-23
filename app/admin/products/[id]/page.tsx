import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { getProductById } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — {product.name.en}
      </h2>
      <ProductForm product={product} />
    </div>
  )
}
