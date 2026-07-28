'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Hero } from '@/components/home/hero'
import { upsertBanner } from '@/app/actions/banners'
import {
  BANNER_STATUS_CLASS,
  BANNER_STATUS_LABEL,
  bannerStatus,
} from '@/lib/admin/banner-status'
import type { HeroSlide } from '@/lib/banners'
import type { BannerRow } from '@/lib/db/schema'

const PLACEMENTS = [
  { value: 'hero', label: 'Homepage hero' },
  { value: 'offer', label: 'Offer strip' },
  { value: 'announcement', label: 'Announcement bar' },
] as const

/**
 * `<input type="datetime-local">` speaks local wall-clock time with no zone.
 * `toISOString()` would shift by the UTC offset and quietly move an Eid slide
 * by hours, so the value is assembled from the local parts instead.
 */
function toLocalInput(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function BannerForm({ banner }: { banner?: BannerRow }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const isEdit = Boolean(banner)

  const [form, setForm] = useState({
    placement: banner?.placement ?? 'hero',
    image: banner?.image ?? '',
    labelEn: banner?.label?.en ?? '',
    labelBn: banner?.label?.bn ?? '',
    titleEn: banner?.title.en ?? '',
    titleBn: banner?.title.bn ?? '',
    highlightEn: banner?.highlight?.en ?? '',
    highlightBn: banner?.highlight?.bn ?? '',
    subtitleEn: banner?.subtitle?.en ?? '',
    subtitleBn: banner?.subtitle?.bn ?? '',
    ctaLabelEn: banner?.ctaLabel?.en ?? '',
    ctaLabelBn: banner?.ctaLabel?.bn ?? '',
    ctaHref: banner?.ctaHref ?? '/shop',
    startsAt: toLocalInput(banner?.startsAt ?? null),
    endsAt: toLocalInput(banner?.endsAt ?? null),
    active: banner?.active ?? true,
    sortOrder: String(banner?.sortOrder ?? 0),
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  /** Bangla falls back to English, matching how the product form behaves. */
  const pair = (en: string, bn: string) => {
    const left = en.trim()
    if (!left) return null
    return { en: left, bn: bn.trim() || left }
  }

  const status = bannerStatus({
    active: form.active,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
  })

  const preview = useMemo<HeroSlide[]>(() => {
    if (!form.image || !form.titleEn.trim()) return []
    return [
      {
        id: 'preview',
        image: form.image,
        label: pair(form.labelEn, form.labelBn),
        title: pair(form.titleEn, form.titleBn) ?? { en: '', bn: '' },
        highlight: pair(form.highlightEn, form.highlightBn),
        subtitle: pair(form.subtitleEn, form.subtitleBn),
        ctaLabel: pair(form.ctaLabelEn, form.ctaLabelBn),
        ctaHref: form.ctaHref || '/shop',
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.image.trim() || !form.titleEn.trim()) {
      toast.error('An image and an English title are required')
      return
    }

    setPending(true)
    try {
      await upsertBanner({
        id: banner?.id,
        placement: form.placement,
        image: form.image.trim(),
        label: pair(form.labelEn, form.labelBn),
        title: pair(form.titleEn, form.titleBn)!,
        highlight: pair(form.highlightEn, form.highlightBn),
        subtitle: pair(form.subtitleEn, form.subtitleBn),
        ctaLabel: pair(form.ctaLabelEn, form.ctaLabelBn),
        ctaHref: form.ctaHref.trim() || '/shop',
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      })
      toast.success(isEdit ? 'Banner updated' : 'Banner created')
      router.push('/admin/banners')
      router.refresh()
    } catch (error) {
      setPending(false)
      toast.error(
        error instanceof Error ? error.message : 'Could not save banner',
      )
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Placement">
            <select
              value={form.placement}
              onChange={(e) =>
                set('placement', e.target.value as typeof form.placement)
              }
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {PLACEMENTS.map((placement) => (
                <option key={placement.value} value={placement.value}>
                  {placement.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
            />
          </Field>
        </div>

        <ImageUploader
          value={form.image}
          onChange={(url) => set('image', url)}
          folder="banners"
          label="Banner image"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow (English)">
            <Input
              value={form.labelEn}
              onChange={(e) => set('labelEn', e.target.value)}
              placeholder="Eid Collection"
            />
          </Field>
          <Field label="Eyebrow (Bangla)">
            <Input
              value={form.labelBn}
              onChange={(e) => set('labelBn', e.target.value)}
              placeholder="ঈদ কালেকশন"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline (English)">
            <Input
              value={form.titleEn}
              onChange={(e) => set('titleEn', e.target.value)}
              placeholder="Dress Up This"
            />
          </Field>
          <Field label="Headline (Bangla)">
            <Input
              value={form.titleBn}
              onChange={(e) => set('titleBn', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Highlight (English)"
            hint="Shown in the brand colour at the end of the headline"
          >
            <Input
              value={form.highlightEn}
              onChange={(e) => set('highlightEn', e.target.value)}
              placeholder="Eid"
            />
          </Field>
          <Field label="Highlight (Bangla)">
            <Input
              value={form.highlightBn}
              onChange={(e) => set('highlightBn', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subtitle (English)">
            <Textarea
              rows={2}
              value={form.subtitleEn}
              onChange={(e) => set('subtitleEn', e.target.value)}
            />
          </Field>
          <Field label="Subtitle (Bangla)">
            <Textarea
              rows={2}
              value={form.subtitleBn}
              onChange={(e) => set('subtitleBn', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Button text (English)">
            <Input
              value={form.ctaLabelEn}
              onChange={(e) => set('ctaLabelEn', e.target.value)}
              placeholder="Shop Eid"
            />
          </Field>
          <Field label="Button text (Bangla)">
            <Input
              value={form.ctaLabelBn}
              onChange={(e) => set('ctaLabelBn', e.target.value)}
            />
          </Field>
          <Field label="Button link" hint="A path like /shop, or an https:// URL">
            <Input
              value={form.ctaHref}
              onChange={(e) => set('ctaHref', e.target.value)}
              placeholder="/shop"
            />
          </Field>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-xs text-muted-foreground">
                Leave both blank to run until you turn it off.
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`border-0 ${BANNER_STATUS_CLASS[status]}`}
            >
              {BANNER_STATUS_LABEL[status]}
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </Field>
            <Field label="Ends">
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Switch
              id="banner-active"
              checked={form.active}
              onCheckedChange={(checked) => set('active', checked)}
            />
            <Label htmlFor="banner-active" className="cursor-pointer">
              Active
            </Label>
            <span className="text-xs text-muted-foreground">
              Turning this off hides the banner regardless of the dates.
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create banner'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/banners')}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* The real hero component, so what you approve is what ships. */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Preview
        </h3>
        {preview.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="pointer-events-none">
              <Hero slides={preview} />
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Add an image and an English headline to see the preview.
          </p>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
