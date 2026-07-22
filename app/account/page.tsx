import type { Metadata } from 'next'
import { AccountContent } from '@/components/account-content'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('account')
}

export default function AccountPage() {
  return <AccountContent />
}
