'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useLanguage } from '@/components/language-provider'
import type { Localized } from '@/lib/i18n'

const SLICE_COLOURS = ['#7c5cff', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']

function NoData({ title, hint }: { title: string; hint: string }) {
  return (
    <Empty className="h-[240px] border-0">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{hint}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

const monthLabel = (key: string) => {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleString('en', {
    month: 'short',
  })
}

/** Revenue and orders over the last 12 months, toggleable. */
export function SalesChart({
  data,
}: {
  data: { month: string; revenue: number; orders: number }[]
}) {
  const { price: currency } = useLanguage()
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue')

  const points = useMemo(
    () => data.map((row) => ({ ...row, label: monthLabel(row.month) })),
    [data],
  )
  const hasData = points.some((point) => point.revenue > 0 || point.orders > 0)

  const config = {
    revenue: { label: 'Revenue', color: '#7c5cff' },
    orders: { label: 'Orders', color: '#0ea5e9' },
  } satisfies ChartConfig

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Sales over time</CardTitle>
        <CardDescription>Last 12 months</CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            size="sm"
            value={metric}
            onValueChange={(value) =>
              value && setMetric(value as 'revenue' | 'orders')
            }
            variant="outline"
          >
            <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem>
            <ToggleGroupItem value="orders">Orders</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={config} className="h-[260px] w-full">
            <AreaChart data={points} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="fill-metric" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={config[metric].color}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={config[metric].color}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={54}
                fontSize={12}
                tickFormatter={(value: number) =>
                  metric === 'revenue' ? currency(value) : String(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      metric === 'revenue'
                        ? currency(Number(value))
                        : `${value} orders`
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={config[metric].color}
                strokeWidth={2}
                fill="url(#fill-metric)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <NoData
            title="No sales yet"
            hint="This chart fills in as orders come through."
          />
        )}
      </CardContent>
    </Card>
  )
}

/** Revenue share per category. */
export function CategoryChart({
  data,
}: {
  data: { slug: string; name: Localized; units: number; revenue: number }[]
}) {
  const { pick, price: currency } = useLanguage()

  const points = data.map((row, index) => ({
    name: pick(row.name),
    revenue: row.revenue,
    units: row.units,
    fill: SLICE_COLOURS[index % SLICE_COLOURS.length],
  }))

  const config = Object.fromEntries(
    points.map((point) => [point.name, { label: point.name, color: point.fill }]),
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best-selling categories</CardTitle>
        <CardDescription>By revenue, all time</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length > 0 ? (
          <ChartContainer config={config} className="mx-auto h-[240px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(value) => currency(Number(value))}
                  />
                }
              />
              <Pie
                data={points}
                dataKey="revenue"
                nameKey="name"
                innerRadius={54}
                outerRadius={84}
                paddingAngle={2}
              >
                {points.map((point) => (
                  <Cell key={point.name} fill={point.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <NoData
            title="No category sales yet"
            hint="Categories rank here once orders contain products."
          />
        )}
      </CardContent>
    </Card>
  )
}

/** Units sold for the top products. */
export function TopProductsChart({
  data,
}: {
  data: { id: string; name: Localized; units: number; revenue: number }[]
}) {
  const { pick, price: currency } = useLanguage()

  const points = data.map((row) => ({
    name: pick(row.name),
    revenue: row.revenue,
    units: row.units,
  }))

  const config = {
    revenue: { label: 'Revenue', color: '#10b981' },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>By revenue, all time</CardDescription>
      </CardHeader>
      <CardContent>
        {points.length > 0 ? (
          <ChartContainer config={config} className="h-[240px] w-full">
            <BarChart
              data={points}
              layout="vertical"
              margin={{ left: 4, right: 12 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value: number) => currency(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={110}
                fontSize={12}
                tickFormatter={(value: string) =>
                  value.length > 16 ? `${value.slice(0, 15)}…` : value
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => currency(Number(value))}
                  />
                }
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoData
            title="No product sales yet"
            hint="Your best sellers appear here after the first order."
          />
        )}
      </CardContent>
    </Card>
  )
}
