'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { deleteImage, isOwnedImage } from '@/app/actions/media'
import { downscaleImage } from '@/lib/downscale'
import { IMAGE_HOST_ERROR, isRenderableImageUrl } from '@/lib/image-hosts'
import { cn } from '@/lib/utils'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/**
 * PUTs the file at a presigned URL, reporting progress as it goes.
 *
 * `XMLHttpRequest` rather than `fetch` on purpose: fetch cannot report upload
 * progress, and a 5 MB photo on a phone connection with no progress bar looks
 * like a frozen page.
 */
function putWithProgress(
  url: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    // Must match the type the URL was signed for, or R2 rejects the signature.
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () =>
      reject(new Error('Upload failed — check your connection'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))

    xhr.send(file)
  })
}

/**
 * Drop-in replacement for a plain image URL field: uploads straight to
 * Cloudflare R2 and hands the resulting URL back through `onChange`.
 *
 * The URL-paste escape hatch stays available on purpose — the seed catalogue
 * runs on Unsplash links, and a developer without R2 credentials still needs a
 * way to fill this in.
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
  /**
   * Object-key prefix. The `wholesale-*` pair is what a signed-in non-admin may
   * write to; the upload route gates on exactly these strings. Hand-duplicated
   * from `UPLOAD_FOLDERS` because lib/r2.ts is server-only — keep them in step.
   */
  folder:
    | 'products'
    | 'categories'
    | 'wholesale-products'
    | 'wholesale-documents'
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
      // Shrink first, then presign: the signature pins both content type and
      // length, so a URL minted for the original would be rejected once the
      // resized WebP goes up in its place.
      const upload = await downscaleImage(
        file,
        folder === 'wholesale-documents' ? 'document' : 'photo',
      )

      // Two steps: ask our server for permission and a signed URL, then send
      // the bytes straight to R2 so they never cross a route handler.
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder,
          filename: upload.name,
          contentType: upload.type,
          size: upload.size,
        }),
      })

      const result = (await response.json()) as
        | { uploadUrl: string; url: string }
        | { error: string }

      if (!response.ok || !('uploadUrl' in result)) {
        throw new Error(
          'error' in result ? result.error : 'Could not start the upload',
        )
      }

      await putWithProgress(result.uploadUrl, upload, setProgress)
      onChange(result.url)
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
    if (!(await isOwnedImage(previous))) return
    try {
      await deleteImage(previous)
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
          {/* Plain <img>: this is an admin-only 80px thumbnail of a URL that may
              not be on an allowed host yet (the field is still being edited),
              which is exactly the case next/image throws on. */}
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
        <div className="space-y-1.5">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://…"
            disabled={uploading}
            aria-invalid={!isRenderableImageUrl(value)}
          />
          {/* next/image throws on a host it has not been configured for, which
              would break the storefront rather than just this field — so the
              admin is told here, while they can still fix it. */}
          {!isRenderableImageUrl(value) && (
            <p className="text-xs text-destructive">{IMAGE_HOST_ERROR}</p>
          )}
        </div>
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
