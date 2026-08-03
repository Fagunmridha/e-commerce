import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SellerProductForm } from '@/components/wholesale/seller-product-form'
import { getServerDictionary } from '@/lib/server-locale'

export const dynamic = 'force-dynamic'

export default async function NewSellerProductPage() {
  const t = await getServerDictionary()

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href="/wholesale/dashboard"
            aria-label={t.wholesale.nav.listings}
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t.wholesale.dashboard.newTitle}
        </h1>
      </div>
      <SellerProductForm />
    </div>
  )
}
