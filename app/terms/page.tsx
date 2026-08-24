import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policy-page'
import { policyMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return policyMetadata('terms')
}

export default function TermsPage() {
  return <PolicyPage slug="terms" />
}
