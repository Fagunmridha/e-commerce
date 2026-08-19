import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policy-page'
import { policyMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return policyMetadata('returns')
}

export default function ReturnPolicyPage() {
  return <PolicyPage slug="returns" />
}
