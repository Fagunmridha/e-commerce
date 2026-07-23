'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setUserRole } from '@/app/actions/admin'

export function RoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: number
  role: 'customer' | 'admin'
  isSelf: boolean
}) {
  const [pending, startTransition] = useTransition()
  const next = role === 'admin' ? 'customer' : 'admin'

  return (
    <Button
      size="sm"
      variant={role === 'admin' ? 'outline' : 'default'}
      disabled={pending || (isSelf && role === 'admin')}
      onClick={() =>
        startTransition(async () => {
          try {
            await setUserRole(userId, next)
            toast.success(`Now ${next}`)
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Could not update role',
            )
          }
        })
      }
    >
      {role === 'admin' ? 'Make customer' : 'Make admin'}
    </Button>
  )
}
