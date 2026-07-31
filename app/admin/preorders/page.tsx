import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAdminPreorderProducts } from '@/lib/products'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

/** `2026-08-18` → `18 Aug 2026`. Formatted from the parts so the calendar day
 *  is never shifted by the server's timezone on its way to the screen. */
function formatDay(value?: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export default async function AdminPreordersPage() {
  const products = await getAdminPreorderProducts()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pre-orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming stock shown in the homepage Coming Soon rail. Booked is
            what customers have taken; remaining is what is left of the run.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            New product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No pre-order products yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open any product and switch on “Pre-order (Coming Soon)”, then set a
            delivery date and how many pieces you are taking bookings for.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-5">
            <Link href="/admin/products">Go to products</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Delivery from</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Booked</th>
                <th className="px-4 py-3 font-semibold">Remaining</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const booked = product.preorderBooked ?? 0
                const soldOut = product.stock === 0

                return (
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
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDay(product.preorderShipsAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {booked}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          soldOut
                            ? 'font-semibold text-destructive'
                            : 'text-foreground'
                        }
                      >
                        {product.stock}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {booked + product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          soldOut
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {soldOut ? 'Fully booked' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/products/${product.id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
