'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { useLanguage } from '@/components/language-provider'

export function AccountContent() {
  const { t } = useLanguage()

  return (
    <>
      <PageHeader pageKey="account" />

      <section className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          {/* Static UI for now — auth lands in a later step. */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-email">{t.account.email}</Label>
              <Input
                id="account-email"
                type="email"
                placeholder={t.account.emailPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">{t.account.password}</Label>
              <Input id="account-password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full" size="lg" disabled>
              {t.account.signIn}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t.account.notLiveBefore}{' '}
              <Link href="/shop" className="text-primary hover:underline">
                {t.account.keepShopping}
              </Link>{' '}
              {t.account.or}{' '}
              <Link href="/contact" className="text-primary hover:underline">
                {t.account.contactUs}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
