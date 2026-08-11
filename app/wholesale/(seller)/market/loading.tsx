import { CatalogueSkeleton } from '@/components/catalogue-skeleton'

/**
 * The market is a product grid, so it borrows the same placeholder /shop and
 * the category routes use rather than /wholesale's form-shaped one.
 */
export default function Loading() {
  return <CatalogueSkeleton />
}
