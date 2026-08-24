import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { STORE_CONTACT } from '@/lib/site-config'
import type { Dictionary } from '@/lib/dictionaries'

export type StoreContactRow = {
  Icon: typeof Phone
  label: string
  lines: string[]
  /** `tel:`/`mailto:` for the first line, where one makes sense. */
  href?: string
}

/**
 * The store’s own contact details, ready to render — used by the contact page
 * and by the block at the foot of every policy page. Labels are translated,
 * values are not: they come from `lib/site-config.ts`, which is the only place
 * the number, email and address are written down.
 */
export function storeContactRows(t: Dictionary): StoreContactRow[] {
  return [
    {
      Icon: Phone,
      label: t.storeContact.phone,
      lines: [STORE_CONTACT.phone],
      href: `tel:${STORE_CONTACT.phoneDial}`,
    },
    {
      Icon: Mail,
      label: t.storeContact.email,
      lines: [STORE_CONTACT.email],
      href: `mailto:${STORE_CONTACT.email}`,
    },
    {
      Icon: MapPin,
      label: t.storeContact.address,
      lines: [STORE_CONTACT.address],
    },
    {
      Icon: Clock,
      label: t.storeContact.hoursLabel,
      lines: [t.storeContact.hours],
    },
  ]
}
