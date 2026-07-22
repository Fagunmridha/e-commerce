import type { Metadata } from 'next'
import { OrderSuccessContent } from '@/components/order-success-content'
import { getServerDictionary } from '@/lib/server-locale'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary()
  return { title: `${t.orderSuccess.title} ${t.meta.suffix}` }
}

export default function OrderSuccessPage() {
  return <OrderSuccessContent />
}
