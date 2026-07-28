import { BannerForm } from '@/components/admin/banners/banner-form'

export const dynamic = 'force-dynamic'

export default function NewBannerPage() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">New banner</h2>
      <BannerForm />
    </div>
  )
}
