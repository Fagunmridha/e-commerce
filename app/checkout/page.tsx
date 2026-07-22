import type { Metadata } from 'next'
import { CheckoutContent } from '@/components/checkout-content'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('checkout')
}

export default function CheckoutPage() {
  return <CheckoutContent />
}
