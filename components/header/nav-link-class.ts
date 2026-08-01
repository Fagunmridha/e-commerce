/**
 * Shared styling for the desktop nav items. The current page is marked with an
 * underline in the primary colour, drawn with ::after so it wipes in from the
 * left instead of popping. Both the plain links and the Shop mega-menu trigger
 * pull from here, so the marker stays identical across the row.
 *
 * These live outside site-header.tsx because the mega-menu needs them too, and
 * importing back into the header would close an import cycle.
 */
export const NAV_LINK_CLASS =
  'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary after:pointer-events-none after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300'

export const NAV_LINK_ACTIVE = 'text-primary after:scale-x-100'
