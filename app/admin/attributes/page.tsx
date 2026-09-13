import { AttributesManager } from '@/components/admin/attributes-manager'
import { getAllAttributeDefinitions } from '@/lib/attributes'
import { getAllCategories } from '@/lib/products'

export const dynamic = 'force-dynamic'

export default async function AdminAttributesPage() {
  const [definitions, categories] = await Promise.all([
    getAllAttributeDefinitions(),
    // Every category, inactive ones included: a field can be defined on a
    // branch that is switched off, and the form still has to be able to name
    // where an existing field lives.
    getAllCategories(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Product fields
        </h1>
        <p className="text-muted-foreground">
          What a product in a given part of the tree has to say about itself —
          Size and Fabric under Clothing, RAM and Warranty under Electronics.
          Add a field here and both product forms start asking for it; nothing
          in the code has to change.
        </p>
      </div>
      <AttributesManager definitions={definitions} categories={categories} />
    </div>
  )
}
