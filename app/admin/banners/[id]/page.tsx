import { notFound } from 'next/navigation'
import { BannerForm } from '@/components/admin/banners/banner-form'
import { getBannerById } from '@/lib/banners'

export const dynamic = 'force-dynamic'

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const banner = await getBannerById(id)
  if (!banner) notFound()

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — {banner.title.en}
      </h2>
      <BannerForm banner={banner} />
    </div>
  )
}
