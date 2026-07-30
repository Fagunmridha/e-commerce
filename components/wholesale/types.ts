import type { BusinessType } from '@/lib/validation/wholesalers'
import type { WholesalerApplicationRow } from '@/lib/db/schema'

/**
 * The application as the client components see it: dates already formatted on
 * the server, so nothing downstream has to think about locales or timezones.
 */
export type WholesaleApplicationView = {
  status: WholesalerApplicationRow['status']
  shopName: string
  businessType: BusinessType
  taxToken: string | null
  binNumber: string | null
  tradeLicenseNo: string | null
  yearsInBusiness: number | null
  contactName: string
  phone: string
  altPhone: string | null
  email: string
  website: string | null
  address: string
  city: string
  district: string | null
  postcode: string | null
  taxTokenImage: string | null
  tradeLicenseImage: string | null
  shopPhoto: string | null
  note: string | null
  reviewNote: string | null
  submittedOn: string
}
