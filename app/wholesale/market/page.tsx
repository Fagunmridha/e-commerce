import type { Metadata } from 'next'
import {
  WholesaleMarket,
  type MarketFacetData,
} from '@/components/wholesale/wholesale-market'
import {
  getAttributesForProducts,
  getCachedAttributeDefinitions,
} from '@/lib/attributes'
import { getWholesaleProducts } from '@/lib/products'
import { pageMetadata } from '@/lib/metadata'

// Joined wholesale buyers only — the gate is in ./layout.tsx.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesaleMarket')
}

/**
 * The admin-defined choice fields, and every listing's answers to them — the
 * facets behind filters like "Brand" in the sidebar.
 *
 * Nothing here names a field. "Brand" is a filter only because an admin created
 * a choice field called Brand in /admin/attributes; create "Fabric" tomorrow
 * and it becomes a filter too, with no code change.
 *
 * The answers are a second round trip, so it is only paid when there is a
 * choice field to answer. On a store with none, the market costs exactly what
 * it did before — and the definitions themselves are cached.
 */
async function loadFacets(): Promise<MarketFacetData> {
  const definitions = (await getCachedAttributeDefinitions()).filter(
    (definition) =>
      definition.status === 'active' && definition.type === 'select',
  )
  if (definitions.length === 0) return { definitions: [], values: {} }

  const listings = await getWholesaleProducts()
  const answers = await getAttributesForProducts(listings.map((p) => p.id))

  // Flattened to plain objects: this crosses into a client component, and a
  // `Map` does not survive serialisation.
  const values: MarketFacetData['values'] = {}
  for (const [productId, list] of answers) {
    values[productId] = Object.fromEntries(
      list.map((entry) => [entry.definitionId, entry.value]),
    )
  }
  return { definitions, values }
}

export default async function WholesaleMarketPage() {
  // No `PageHeader`: `WholesaleMarket` opens with its own breadcrumb and hero.
  return <WholesaleMarket facets={await loadFacets()} />
}
