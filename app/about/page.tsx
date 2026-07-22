import type { Metadata } from 'next'
import { AboutContent } from '@/components/about-content'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('about')
}

export default function AboutPage() {
  return <AboutContent />
}
