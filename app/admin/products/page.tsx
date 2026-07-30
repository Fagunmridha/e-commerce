import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAdminProducts } from '@/lib/products'
import { DeleteProductButton } from '@/components/admin/delete-product-button'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  // Includes marketplace listings — an admin managing stock needs the lot.
  const products = await getAdminProducts()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Products</h2>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            New product
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Seller</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="size-10 rounded object-cover"
                    />
                    <span className="font-medium text-foreground">
                      {product.name.en}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {product.category}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {product.sellerName ?? 'In-house'}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      product.stock === 0
                        ? 'font-semibold text-destructive'
                        : 'text-foreground'
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                    </Button>
                    <DeleteProductButton id={product.id} name={product.name.en} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
