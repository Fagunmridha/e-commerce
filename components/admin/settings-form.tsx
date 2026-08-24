'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Percent, Settings2 } from 'lucide-react'
import { LoadingOverlay } from '@/components/loading-overlay'
import { updateStoreSettings } from '@/app/actions/settings'
import type { StoreSettingsRow } from '@/lib/db/schema'

export function SettingsForm({ settings }: { settings: StoreSettingsRow }) {
  const [pending, setPending] = useState(false)
  const [form, setForm] = useState({
    defaultCommissionPct: settings.defaultCommissionPct.toString(),
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    
    const pct = Number(form.defaultCommissionPct)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Commission must be between 0 and 100')
      return
    }

    setPending(true)
    try {
      await updateStoreSettings(pct)
      toast.success('Settings updated')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Settings2 className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Global Commission</CardTitle>
              <CardDescription>
                The default platform commission applied to all new wholesale listings unless specifically overridden by an admin.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label>Default Commission Rate (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                min={0}
                max={100}
                step="1"
                className="pl-9"
                value={form.defaultCommissionPct}
                onChange={(e) => set('defaultCommissionPct', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Example: 10 = 10% platform cut.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-[120px]">
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
