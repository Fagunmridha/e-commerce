'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteProduct } from '@/app/actions/admin'

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
        startTransition(async () => {
          try {
            await deleteProduct(id)
            toast.success('Product deleted')
          } catch {
            toast.error('Could not delete product')
          }
        })
      }}
    >
      Delete
    </Button>
  )
}
