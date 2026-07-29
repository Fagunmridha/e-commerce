import 'dotenv/config'
import { db } from './index'
import { categories, products } from './schema'
import { SEED_CATEGORIES, SEED_PRODUCTS } from './seed-data'

/**
 * Seeds the initial catalogue into Neon. Idempotent — re-running upserts by
 * primary key, so it is safe to run after schema changes. Reviews, users and
 * orders are intentionally NOT seeded: they are created by real usage.
 *
 * Run with: pnpm db:seed
 */
async function main() {
  console.log('Seeding categories…')
  for (const category of SEED_CATEGORIES) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: category.name, image: category.image },
      })
  }

  console.log('Seeding products…')
  for (const product of SEED_PRODUCTS) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: product.name,
          price: product.price,
          oldPrice: product.oldPrice ?? null,
          image: product.image,
          category: product.category,
          badge: product.badge ?? null,
          sizes: product.sizes ?? null,
          colors: product.colors ?? null,
          description: product.description ?? null,
          stock: product.stock,
        },
      })
  }

  console.log(
    `Done — ${SEED_CATEGORIES.length} categories, ${SEED_PRODUCTS.length} products.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
