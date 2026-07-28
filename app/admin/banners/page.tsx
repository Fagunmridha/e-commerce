import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  BannersTable,
  type BannerRowView,
} from '@/components/admin/banners/banners-table'
import { getAllBanners } from '@/lib/banners'
import { bannerStatus, formatWindow } from '@/lib/admin/banner-status'

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
  const rows = await getAllBanners()
  const now = new Date()

  // Status and window are derived here so the table receives plain strings —
  // Dates would need serialising anyway, and the CSV export reads raw values.
  const banners: BannerRowView[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    placement: row.placement,
    image: row.image,
    title: row.title.en,
    ctaHref: row.ctaHref,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    active: row.active,
    sortOrder: row.sortOrder,
    status: bannerStatus(row, now),
    window: formatWindow(row.startsAt, row.endsAt),
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Banners</h2>
          <p className="text-sm text-muted-foreground">
            The homepage hero rotates through every live slide. Schedule one
            ahead and it goes up on its own.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/banners/new">
            <Plus className="size-4" />
            New banner
          </Link>
        </Button>
      </div>

      <BannersTable banners={banners} />
    </div>
  )
}
