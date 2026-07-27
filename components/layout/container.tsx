import { cn } from '@/lib/utils'

/**
 * The single page gutter. Width comes from the `--container-page` token, so the
 * whole site widens or narrows from one value in globals.css.
 */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('mx-auto w-full max-w-page px-2 sm:px-3 lg:px-4', className)}
    >
      {children}
    </div>
  )
}
