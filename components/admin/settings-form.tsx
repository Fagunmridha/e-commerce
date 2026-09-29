'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Clock, Info, Percent, Settings2 } from 'lucide-react'
import { LoadingOverlay } from '@/components/loading-overlay'
import { updateStoreSettings } from '@/app/actions/settings'
import { formatPrice } from '@/lib/currency'
import type { StoreSettingsRow } from '@/lib/db/schema'

// A round number just for illustrating the split — not a real order.
const EXAMPLE_ORDER = 10_000

export function SettingsForm({ settings }: { settings: StoreSettingsRow }) {
  const [pending, setPending] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(settings.updatedAt)
  const [form, setForm] = useState({
    defaultCommissionPct: settings.defaultCommissionPct.toString(),
  })

  const dirty = form.defaultCommissionPct !== settings.defaultCommissionPct.toString()
  const pctValue = Number(form.defaultCommissionPct)
  const pctValid = !isNaN(pctValue) && pctValue >= 0 && pctValue <= 100
  const commissionCut = pctValid ? Math.round((EXAMPLE_ORDER * pctValue) / 100) : 0

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!pctValid) {
      toast.error('Commission must be between 0 and 100')
      return
    }

    setPending(true)
    try {
      await updateStoreSettings(pctValue)
      setUpdatedAt(new Date())
      toast.success('Settings updated')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <LoadingOverlay show={pending} label="Saving…" />

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Settings2 className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Global Commission</CardTitle>
              <CardDescription>
                The default platform commission applied to all new wholesale
                listings unless specifically overridden by an admin.
              </CardDescription>
            </div>
            {dirty && (
              <Badge variant="outline" className="ml-auto shrink-0 border-amber-500/40 text-amber-600">
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs space-y-2">
            <Label>Default Commission Rate (%)</Label>
            <div className="relative">
              <Percent className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                max={100}
                step="1"
                className="pl-9"
                value={form.defaultCommissionPct}
                onChange={(e) => set('defaultCommissionPct', e.target.value)}
                aria-invalid={!pctValid}
              />
            </div>
            {!pctValid && (
              <p className="text-xs font-medium text-destructive">
                Enter a rate between 0 and 100.
              </p>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Example
            </p>
            <p className="mt-1.5 text-sm text-foreground">
              On a {formatPrice(EXAMPLE_ORDER)} wholesale order, the platform
              keeps{' '}
              <span className="font-semibold text-primary">
                {formatPrice(commissionCut)}
              </span>{' '}
              and the seller receives{' '}
              <span className="font-semibold">
                {formatPrice(EXAMPLE_ORDER - commissionCut)}
              </span>
              .
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden />
            Last updated{' '}
            {new Date(updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <Button type="submit" disabled={pending || !dirty} className="sm:min-w-[120px]">
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="h-fit bg-secondary/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm">How this is used</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Used for any listing that doesn't have its own commission rate —
            applied fresh each time an order is placed, not locked in when
            the listing is created.
          </p>
          <p>
            A listing with its own rate set (in its product form) overrides
            this default entirely.
          </p>
          <p>
            Orders already placed keep the rate they were sold at, so
            changing this never rewrites past settlements.
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
