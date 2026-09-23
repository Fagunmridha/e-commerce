import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/account-nav'
import { getAccountContext } from '@/lib/account'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('account')
}

/**
 * The account area's shell: a sidebar and, beside it, whichever section is open.
 * The sidebar is built from where the person stands with the wholesale
 * programme, so a buyer, a seller and a plain shopper each get their own
 * options — see `AccountNav`.
 *
 * Signing in is required by the middleware for everything under /account, and
 * `getAccountContext` redirects if the row still cannot be resolved. It is
 * request-scoped, so the page under this layout reads the same lookup for free.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { name, email, wholesaleRole, wholesaleStatus } =
    await getAccountContext()

  return (
    <section className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-4 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        <AccountNav
          name={name}
          email={email}
          wholesaleRole={wholesaleRole}
          wholesaleStatus={wholesaleStatus}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  )
}
