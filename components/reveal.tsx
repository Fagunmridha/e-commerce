import { cn } from '@/lib/utils'

export type RevealVariant = 'up' | 'fade' | 'scale'

/**
 * Formerly animated its children in on scroll; the site no longer animates
 * sections, so this now renders its children as-is. Kept as a wrapper so the
 * call sites (and their `as` semantics) stay unchanged. `delay` and `variant`
 * are accepted and ignored.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
}: {
  children: React.ReactNode
  delay?: number
  variant?: RevealVariant
  /** Render as a different element so Reveal never breaks semantics. */
  as?: 'div' | 'li' | 'section' | 'article'
  className?: string
}) {
  return <Tag className={cn(className)}>{children}</Tag>
}
