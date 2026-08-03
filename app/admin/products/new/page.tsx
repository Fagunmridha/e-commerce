import { ProductForm } from '@/components/admin/product-form'

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h2 className="mb-6 text-xl font-bold text-foreground">New product</h2>
      <ProductForm />
    </div>
  )
}
