import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policy-page'
import { policyMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return policyMetadata('privacy')
}

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy" />
}
