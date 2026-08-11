'use client'

import { Spinner } from '@/components/ui/spinner'

/**
 * The page-centred "working on it" screen for a submit that commits something.
 *
 * A disabled button with its label swapped to "Submitting…" is easy to miss on
 * a long form — the button is often scrolled past by the time the action lands,
 * and on a slow connection the page looks frozen. This covers the viewport
 * instead, so there is one obvious answer to "did my click register?", and it
 * blocks a second click on the way.
 *
 * Sits under the toaster (`z-[100]`) on purpose: the success or error toast
 * fires as this unmounts, and the two should never fight.
 */
export function LoadingOverlay({
  show,
  label,
}: {
  show: boolean
  label?: string
}) {
  if (!show) return null

  return (
    <div
      // `aria-live="assertive"`: a screen reader should hear this the moment it
      // appears rather than after whatever it is currently reading.
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-8 py-7 shadow-float">
        <Spinner className="size-8 text-primary" />
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
      </div>
    </div>
  )
}
