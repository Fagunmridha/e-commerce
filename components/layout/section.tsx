import { Container } from '@/components/layout/container'
import { cn } from '@/lib/utils'

/**
 * A page section with the standard vertical rhythm. `tone` swaps the two
 * allowed backgrounds so sections can alternate without ad-hoc colour classes.
 */
export function Section({
  children,
  tone = 'default',
  size = 'default',
  bleed = false,
  className,
  containerClassName,
  ...rest
}: {
  children: React.ReactNode
  tone?: 'default' | 'muted'
  /** `tight` for supporting rows, `default` for content sections. */
  size?: 'tight' | 'default'
  /** Skip the Container — for sections that manage their own full-bleed layout. */
  bleed?: boolean
  className?: string
  containerClassName?: string
} & Omit<React.ComponentPropsWithoutRef<'section'>, 'children' | 'className'>) {
  return (
    <section
      className={cn(
        tone === 'muted' ? 'bg-secondary/60' : 'bg-background',
        size === 'tight' ? 'py-12 lg:py-14' : 'py-14 lg:py-20',
        className,
      )}
      {...rest}
    >
      {bleed ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  )
}
