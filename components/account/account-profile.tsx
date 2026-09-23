'use client'

import { SignOutButton, useClerk, useUser } from '@clerk/nextjs'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { AccountContext } from '@/lib/account'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

/**
 * Who they are, and the way into changing it. Name, email and password live in
 * Clerk, not in our database, so editing opens Clerk's own profile dialog
 * rather than a form of ours that would have to be kept in step with it.
 */
export function AccountProfile({
  name,
  email,
  memberSince,
  wholesaleRole,
}: Pick<AccountContext, 'name' | 'email' | 'memberSince' | 'wholesaleRole'>) {
  const { pick, locale } = useLanguage()
  const { user } = useUser()
  const { openUserProfile } = useClerk()

  const accountType =
    wholesaleRole === 'seller'
      ? pick({ en: 'Wholesale seller', bn: 'পাইকারি বিক্রেতা' })
      : wholesaleRole === 'buyer'
        ? pick({ en: 'Wholesale buyer', bn: 'পাইকারি ক্রেতা' })
        : pick({ en: 'Customer', bn: 'গ্রাহক' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {pick({ en: 'Profile', bn: 'প্রোফাইল' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick({
            en: 'Your details and how you sign in.',
            bn: 'আপনার তথ্য এবং সাইন ইনের উপায়।',
          })}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary"
            >
              {(name || email).slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-foreground">
              {name || email}
            </p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openUserProfile()}>
            <ShieldCheck className="size-4" aria-hidden />
            {pick({ en: 'Edit profile & security', bn: 'প্রোফাইল ও নিরাপত্তা' })}
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <Field
            label={pick({ en: 'Account type', bn: 'অ্যাকাউন্টের ধরন' })}
            value={accountType}
          />
          <Field
            label={pick({ en: 'Member since', bn: 'সদস্য হয়েছেন' })}
            value={new Date(memberSince).toLocaleDateString(
              locale === 'bn' ? 'bn-BD' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )}
          />
          <Field label={pick({ en: 'Email', bn: 'ইমেইল' })} value={email} />
        </dl>
      </div>

      {/* The sidebar has this on desktop; below `lg` it is a row of pills. */}
      <div className="lg:hidden">
        <SignOutButton redirectUrl="/">
          <Button variant="outline" className="w-full">
            <LogOut className="size-4" aria-hidden />
            {pick({ en: 'Sign out', bn: 'সাইন আউট' })}
          </Button>
        </SignOutButton>
      </div>
    </div>
  )
}
