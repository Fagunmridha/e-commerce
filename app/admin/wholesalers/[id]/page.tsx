import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
import {
  ApplicationReview,
  type ApplicationDetailView,
} from '@/components/admin/wholesalers/application-review'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getApplicationById } from '@/lib/wholesalers'
import { getSellerProducts } from '@/lib/products'
import { BUSINESS_TYPE_LABEL } from '@/lib/admin/wholesaler-status'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

const DATE = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
} as const

export default async function AdminWholesalerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const application = await getApplicationById(id)
  if (!application) notFound()

  const [[reviewer], listings] = await Promise.all([
    application.reviewedByUserId
      ? db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, application.reviewedByUserId))
      : Promise.resolve([]),
    // What they are actually selling right now, not what they proposed —
    // sellers manage their own catalogue once approved.
    getSellerProducts(application.id),
  ])

  const fields: ApplicationDetailView['fields'] = [
    { label: 'Shop', value: application.shopName },
    {
      label: 'Business type',
      value:
        BUSINESS_TYPE_LABEL[application.businessType] ??
        application.businessType,
    },
    { label: 'Tax token / TIN', value: application.taxToken ?? '—' },
    { label: 'VAT / BIN', value: application.binNumber ?? '—' },
    { label: 'Trade licence no.', value: application.tradeLicenseNo ?? '—' },
    {
      label: 'Years in business',
      value: application.yearsInBusiness?.toString() ?? '—',
    },
    { label: 'Contact', value: application.contactName },
    {
      label: 'Phone',
      value: application.phone,
      href: `tel:${application.phone}`,
    },
    {
      label: 'Alternate phone',
      value: application.altPhone ?? '—',
      href: application.altPhone ? `tel:${application.altPhone}` : undefined,
    },
    {
      label: 'Email',
      value: application.email,
      href: `mailto:${application.email}`,
    },
    { label: 'Website', value: application.website ?? '—' },
    { label: 'Address', value: application.address },
    { label: 'City', value: application.city },
    { label: 'District', value: application.district ?? '—' },
    { label: 'Postcode', value: application.postcode ?? '—' },
    { label: 'Submitted', value: application.createdAt.toLocaleDateString('en-GB', DATE) },
    { label: 'Note from applicant', value: application.note ?? '—' },
  ]

  const documents = [
    { label: 'Owner photo', url: application.ownerPhoto },
    { label: 'Shop photo', url: application.shopPhoto },
    { label: 'Trade licence', url: application.tradeLicenseImage },
  ].flatMap((doc) => (doc.url ? [{ label: doc.label, url: doc.url }] : []))

  const view: ApplicationDetailView = {
    id: application.id,
    status: application.status,
    fields,
    documents,
    products: listings.map((product) => ({
      name: product.name.en,
      image: product.image,
      category: product.category,
      price: formatPrice(product.price),
      sizes: product.sizes?.join(', ') ?? '—',
      stock: product.stock,
      moq: product.moq ?? 1,
      href: `/admin/products/${product.id}`,
    })),
    reviewNote: application.reviewNote,
    reviewedBy: reviewer ? (reviewer.name ?? reviewer.email) : null,
    reviewedAt:
      application.reviewedAt?.toLocaleDateString('en-GB', DATE) ?? null,
  }

  return (
    <div>
      <SetBreadcrumbLabel label={application.shopName} />
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link href="/admin/wholesalers">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to wholesalers</span>
          </Link>
        </Button>
        <h2 className="text-xl font-bold text-foreground">
          {application.shopName}
        </h2>
      </div>

      <ApplicationReview application={view} />
    </div>
  )
}
