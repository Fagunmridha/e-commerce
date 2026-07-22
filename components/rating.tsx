import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Five stars with a half-star-accurate fill, driven by a 0–5 score. */
export function Rating({
  value,
  reviews,
  size = 'sm',
  className,
}: {
  value: number
  reviews?: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const star = size === 'md' ? 'size-4' : 'size-3.5'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, value - index))

          return (
            <span key={index} className="relative inline-flex">
              <Star className={cn(star, 'text-muted-foreground/30')} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(star, 'fill-amber-400 text-amber-400')}
                />
              </span>
            </span>
          )
        })}
      </div>

      <span className={cn('text-muted-foreground', size === 'md' ? 'text-sm' : 'text-xs')}>
        {value.toFixed(1)}
        {reviews !== undefined && ` (${reviews})`}
      </span>
    </div>
  )
}
