'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />
      
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Global Commission</h2>
          <p className="text-sm text-muted-foreground">
            The default platform commission applied to all new wholesale listings unless specifically overridden by an admin.
          </p>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Default Commission (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="1"
            value={form.defaultCommissionPct}
            onChange={(e) => set('defaultCommissionPct', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            E.g. entering 10 means 10%.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
