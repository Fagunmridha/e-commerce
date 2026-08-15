'use client'

import Link from 'next/link'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Clock,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type StatAccent = 'violet' | 'emerald' | 'amber' | 'sky' | 'rose'

/**
 * Icons are looked up by name rather than passed as a prop: a React component
 * is not serialisable, so a server component cannot hand one to this client
 * component.
 */
const ICONS = {
  // Currency-neutral: the store prices in taka, and lucide has no ৳ glyph.
  revenue: Wallet,
  trending: TrendingUp,
  orders: ShoppingCart,
  pending: Clock,
  products: Package,
  alert: AlertTriangle,
  customers: Users,
} satisfies Record<string, LucideIcon>

export type StatIcon = keyof typeof ICONS

/** Icon chip tint per accent. */
const CHIP: Record<StatAccent, string> = {
  violet: 'bg-violet-500/12 text-violet-600',
  emerald: 'bg-emerald-500/12 text-emerald-600',
  amber: 'bg-amber-500/12 text-amber-600',
  sky: 'bg-sky-500/12 text-sky-600',
  rose: 'bg-rose-500/12 text-rose-600',
}

/** Raw hex per accent — recharts needs a concrete colour, not a CSS variable. */
const STROKE: Record<StatAccent, string> = {
  violet: '#7c5cff',
  emerald: '#10b981',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  rose: '#f43f5e',
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'violet',
  change,
  series,
  href,
}: {
  label: string
  value: string
  /** Secondary line under the value, e.g. "12 pending". */
  hint?: string
  icon: StatIcon
  accent?: StatAccent
  /** Percent change vs the previous 30 days. `null` means no baseline to compare. */
  change?: number | null
  /** 14-point sparkline. Omitted when the metric has no time series. */
  series?: number[]
  href?: string
}) {
  const Icon = ICONS[icon]
  const up = (change ?? 0) >= 0
  const data = series?.map((v, index) => ({ index, v })) ?? []
  // A flat all-zero series draws a meaningless straight line — better to omit.
  const hasSeries = data.length > 1 && data.some((point) => point.v > 0)

  const body = (
    <Card
      className={cn(
        'relative gap-0 overflow-hidden py-0 transition-all duration-200',
        href && 'hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg',
              CHIP[accent],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {change === null || change === undefined ? (
              hint ? (
                <p className="truncate text-xs text-muted-foreground">{hint}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No prior data</p>
              )
            ) : (
              <p className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-semibold',
                    up
                      ? 'text-emerald-600'
                      : 'text-rose-600',
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="truncate text-muted-foreground">
                  {hint ?? 'vs prev 30d'}
                </span>
              </p>
            )}
          </div>

          {hasSeries && (
            <div className="h-9 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient
                      id={`spark-${accent}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={STROKE[accent]}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={STROKE[accent]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={STROKE[accent]}
                    strokeWidth={1.75}
                    fill={`url(#spark-${accent})`}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  )
}
