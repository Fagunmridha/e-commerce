/**
 * Store-wide settings that aren't part of the catalogue/database.
 * Edit these in one place.
 */

/**
 * WhatsApp number for the floating contact button, in wa.me format:
 * digits only, with country code, no `+` or spaces.
 * `01872327575` → `8801872327575`.
 */
export const WHATSAPP_NUMBER = '8801872327575'

/**
 * Where pre-order advances would be sent.
 *
 * Unused today: the store takes pre-orders on cash on delivery, so
 * `DEFAULT_ADVANCE_PCT` is 0 and no shopper is ever shown a number. They matter
 * only once an admin puts a percentage on a product, and that is the point at
 * which they must be set — the fallback below is a placeholder, not a number
 * anyone should send money to.
 *
 * Read from the environment, and deliberately *not* `NEXT_PUBLIC_`: the booking
 * checkout is a server component and passes these down as props, so they never
 * get inlined into the client bundle and can be rotated by changing an env var
 * rather than by a rebuild.
 */
export const BKASH_NUMBER = process.env.BKASH_NUMBER ?? '01XXXXXXXXX'
export const NAGAD_NUMBER = process.env.NAGAD_NUMBER ?? '01XXXXXXXXX'
