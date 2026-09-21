import type { Localized } from '@/lib/i18n'

/**
 * The English label of a localised name, falling back to Bangla. The tree is an
 * admin tool, so it names rows the way the admin typed them first.
 */
export function nodeName(
  name: Partial<Localized> | string | null | undefined,
): string {
  if (typeof name === 'string') return name
  return name?.en || name?.bn || ''
}
