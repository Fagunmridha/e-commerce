'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { deleteBlob } from '@/app/actions/media'
import { cn } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** "Eid Sale Banner.JPG" → "eid-sale-banner.jpg", so blob keys stay readable. */
function slugifyFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

/**
 * Drop-in replacement for a plain image URL field: uploads straight to Vercel
 * Blob and hands the resulting URL back through `onChange`.
 *
 * The URL-paste escape hatch stays available on purpose — the seed catalogue
 * runs on Unsplash links, and a developer without BLOB_READ_WRITE_TOKEN still
 * needs a way to fill this in.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = 'Image',
  className,
}: {
  value: string
  onChange: (url: string) => void
  folder: 'products' | 'categories'
  label?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showUrlField, setShowUrlField] = useState(false)

  const uploading = progress !== null

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Use a JPEG, PNG, WebP or AVIF image')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB`,
      )
      return
    }

    setProgress(0)
    try {
      const blob = await upload(`${folder}/${slugifyFileName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      })
      onChange(blob.url)
      toast.success('Image uploaded')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      toast.error(message)
    } finally {
      setProgress(null)
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    const previous = value
    onChange('')

    // Only ours to delete; pasted URLs are left alone.
    if (!isBlobUrl(previous)) return
    try {
      await deleteBlob(previous)
    } catch {
      // The field is already cleared — an orphaned blob is not worth a
      // failed edit, and /admin/media will be able to sweep these later.
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setShowUrlField((open) => !open)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Link2 className="size-3" aria-hidden="true" />
          {showUrlField ? 'Hide URL field' : 'Paste a URL instead'}
        </button>
      </div>

      {value ? (
        <div className="flex items-start gap-3 rounded-md border border-border p-3">
          {/* Plain <img>: the source is arbitrary and next/image is already
              running unoptimized, so there is nothing to gain here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="size-20 shrink-0 rounded-md border border-border object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-muted-foreground">{value}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-3.5" aria-hidden="true" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={uploading}
                onClick={handleRemove}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files[0]
            if (file) void handleFile(file)
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground transition-colors',
            'hover:border-primary/50 hover:bg-secondary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
            dragging && 'border-primary bg-secondary',
            uploading && 'cursor-not-allowed opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
          <span className="font-medium text-foreground">
            {uploading ? 'Uploading…' : 'Drop an image or click to browse'}
          </span>
          <span className="text-xs">JPEG, PNG, WebP or AVIF — up to 5 MB</span>
        </button>
      )}

      {uploading && <Progress value={progress ?? 0} className="h-1.5" />}

      {showUrlField && (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          disabled={uploading}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
