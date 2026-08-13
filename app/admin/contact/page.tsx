import Link from 'next/link'
import { ContactTable } from '@/components/admin/contact/contact-table'
import { getAdminContactMessages, getContactStatusCounts } from '@/lib/contact'
import { CONTACT_STATUSES, type ContactStatus } from '@/lib/admin/contact-status'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const active = CONTACT_STATUSES.find((value) => value === status) as
    | ContactStatus
    | undefined

  const [messages, counts] = await Promise.all([
    getAdminContactMessages({ status: active }),
    getContactStatusCounts(),
  ])

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything sent from the contact form on the storefront — the sender’s
          email, phone number, subject and message. Open one to read it in full;
          replies are sent by hand from your own email or phone, and “Mark
          replied” is how you record that. Archiving files a message away
          without deleting it.
        </p>
      </div>

      {/* The header bell and the sidebar both deep-link here with a status, so
          the filter runs in SQL rather than only in the table. */}
      <nav className="mb-6 flex flex-wrap gap-1.5">
        {[undefined, ...CONTACT_STATUSES].map((value) => (
          <Link
            key={value ?? 'all'}
            href={value ? `/admin/contact?status=${value}` : '/admin/contact'}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              active === value
                ? 'border-transparent bg-button text-button-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {value ?? 'All'}
            <span className="ml-1.5 opacity-70">{counts[value ?? 'all']}</span>
          </Link>
        ))}
      </nav>

      <ContactTable messages={messages} />
    </div>
  )
}
