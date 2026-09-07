import { Badge } from '@/components/ui/badge'
import type { WholesaleRole } from '@/lib/db/schema'

/**
 * The two axes an account sits on are shown as two badges, never merged into
 * one label: `role` is the app-level admin/customer axis and `wholesaleRole` is
 * which side of the trade programme they joined, and an admin is allowed to be
 * a buyer or a seller as well.
 */
export function RoleBadge({ role }: { role: 'customer' | 'admin' }) {
  return (
    <Badge
      variant="secondary"
      className={
        role === 'admin'
          ? 'border-0 bg-primary/10 capitalize text-primary'
          : 'border-0 bg-muted capitalize text-muted-foreground'
      }
    >
      {role}
    </Badge>
  )
}

const WHOLESALE_CLASS: Record<WholesaleRole, string> = {
  buyer: 'bg-sky-500/12 text-sky-700',
  seller: 'bg-emerald-500/12 text-emerald-700',
}

/**
 * Null is the ordinary shopper who never picked a side — shown as a dash so an
 * empty cell never reads as a loading state.
 */
export function WholesaleRoleBadge({ role }: { role: WholesaleRole | null }) {
  if (!role) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <Badge
      variant="secondary"
      className={`border-0 capitalize ${WHOLESALE_CLASS[role]}`}
    >
      {role}
    </Badge>
  )
}
