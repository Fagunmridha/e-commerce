import { SellerProductForm } from '@/components/wholesale/seller-product-form'
import { getServerDictionary } from '@/lib/server-locale'

export const dynamic = 'force-dynamic'

export default async function NewSellerProductPage() {
  const t = await getServerDictionary()

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
      <h1 className="mb-6 text-xl font-bold text-foreground">
        {t.wholesale.dashboard.newTitle}
      </h1>
      <SellerProductForm />
    </div>
  )
}
