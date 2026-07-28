'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function CopyButton({
  value,
  label,
  className,
}: {
  value: string
  label: string
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => {
        void navigator.clipboard.writeText(value)
        toast.success(`${label} copied`)
      }}
    >
      <Copy className="size-3.5" />
      {label}
    </Button>
  )
}
