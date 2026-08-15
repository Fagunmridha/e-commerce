/**
 * Display state for a message sent from /contact. Stored rather than derived,
 * like `reviewStatus` — the admin moves it by hand as they work the inbox.
 *
 * Four states, because "seen it" and "dealt with it" are genuinely different
 * here: an unanswered message that has merely been read must not look finished.
 */
export type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
}

export const CONTACT_STATUS_CLASS: Record<ContactStatus, string> = {
  new: 'bg-sky-500/12 text-sky-700',
  read: 'bg-amber-500/12 text-amber-700',
  replied: 'bg-emerald-500/12 text-emerald-700',
  archived: 'bg-muted text-muted-foreground',
}

export const CONTACT_STATUSES = ['new', 'read', 'replied', 'archived'] as const
