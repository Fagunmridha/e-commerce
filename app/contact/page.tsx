import type { Metadata } from 'next'
import { ContactContent } from '@/components/contact-content'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('contact')
}

export default function ContactPage() {
  return <ContactContent />
}
