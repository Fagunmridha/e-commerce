import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Does this image column hold an actual photograph?
 *
 * `/placeholder.svg` is what the codebase uses to mean "no picture", and both
 * `categories.image` and `products.image` are NOT NULL — so a row without one
 * carries the placeholder rather than an empty string. Anything that lays a
 * picture out differently when there isn't one has to ask this, and there is
 * exactly one answer to it.
 */
export function hasPhoto(image: string | null | undefined): boolean {
  return Boolean(image) && !image!.endsWith('/placeholder.svg')
}
