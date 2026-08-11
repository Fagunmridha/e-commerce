'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react'

/**
 * How a detail page tells the console header what it is looking at.
 *
 * The header sits above the page in the tree, so it cannot see the order or the
 * product the page just loaded — which is why the breadcrumb used to fall back
 * to humanising the id out of the URL. Fetching the row a second time to name it
 * would be a real cost rather than a theoretical one: none of the admin fetchers
 * are `cache()`d, and the customer one re-runs a full users/orders roll-up. The
 * page already has the name and already renders it, so it hands it up instead.
 *
 * The entry carries the pathname it was written for. During a navigation the
 * header must fall back to a generic word — never the previous entity's name,
 * and never a raw id.
 */
type Entry = { pathname: string; label: string }

const EMPTY: Entry = { pathname: '', label: '' }

/**
 * Client-only state. The single writer is a layout effect, and effects never run
 * during SSR, so there is nothing here to leak between requests — do not "fix"
 * this by writing to it during render.
 */
let current: Entry = EMPTY
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

const getSnapshot = () => current
/** A stable constant, not a fresh object — a new identity each call would loop. */
const getServerSnapshot = () => EMPTY

/** The registered label for `pathname`, or '' when it belongs to another route. */
export function useBreadcrumbLabel(pathname: string): string {
  const entry = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return entry.pathname === pathname ? entry.label : ''
}

/**
 * Before paint, so on a soft navigation the swap from the fallback word to the
 * real name lands in the same frame rather than one frame late. The `useEffect`
 * on the server side only silences React's "useLayoutEffect does nothing on the
 * server" warning; SSR collects no effects either way.
 */
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Dropped into a detail page with the name it already has in hand:
 * `<SetBreadcrumbLabel label={order.orderNumber} />`. Renders nothing.
 */
export function SetBreadcrumbLabel({ label }: { label: string }) {
  const pathname = usePathname()

  useIsomorphicLayoutEffect(() => {
    if (current.pathname === pathname && current.label === label) return
    current = { pathname, label }
    for (const listener of listeners) listener()

    // No cleanup: a label written for a route we have left is already ignored by
    // the pathname check in the hook, so clearing on unmount would only cost an
    // extra render on the way out.
  }, [pathname, label])

  return null
}
