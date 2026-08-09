import { z } from 'zod'
import { BD_PHONE, phoneSchema } from '@/lib/validation/shared'
import type { Dictionary } from '@/lib/dictionaries'

/**
 * The delivery details every order path collects — the cart checkout, the
 * `/lp/[id]` ad funnel and the pre-order booking checkout.
 *
 * It lives here rather than in any one of them because all three used to carry
 * their own copy, and `product-landing.tsx` had drifted far enough to keep a
 * duplicate `BD_PHONE` regex. Messages come from the dictionary so the same
 * schema can speak either language.
 */
export function buildDeliverySchema(errors: Dictionary['checkout']['errors']) {
  return z.object({
    name: z.string().min(2, errors.name),
    phone: z.string().regex(BD_PHONE, errors.phone),
    address: z.string().min(5, errors.address),
    city: z.string().min(2, errors.city),
    // What the delivery charge is priced from. Kept separate from `city`
    // because that field is free text — "Dhaka", "ঢাকা" and "Savar" all arrive
    // through it, and the last one is Dhaka district but not the city rate.
    zone: z.enum(['dhaka', 'outside']),
    notes: z.string().optional(),
  })
}

export type DeliveryValues = z.infer<ReturnType<typeof buildDeliverySchema>>

/**
 * The server-side twin of the form's `zone` field, for `placeOrder`. English
 * message on purpose — like `preorderAdvanceSchema`, this is a last line of
 * defence against a crafted request, not something a shopper should ever read.
 */
export const deliveryZoneSchema = z.enum(['dhaka', 'outside'], {
  message: 'Unknown delivery area',
})

/**
 * The manual mobile-money advance a shopper reports after paying. There is no
 * payment gateway — the shopper sends the money themselves and types back what
 * their bKash/Nagad app showed, which an admin then verifies against their own
 * statement.
 *
 * Note what is *not* here: the amount. It is recomputed server-side from the
 * product's percentage, exactly as `subtotal` is recomputed from prices, so a
 * crafted request cannot book a ৳2,400 item for a ৳1 advance.
 */
export function buildAdvanceSchema(errors: Dictionary['preorder']['errors']) {
  return z.object({
    method: z.enum(['bkash', 'nagad']),
    // Deliberately loose: a bKash TrxID is 10 alphanumerics, Nagad's differ,
    // and a false rejection here loses a real sale that an admin could have
    // verified by eye in ten seconds.
    trxId: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{6,24}$/, errors.trxId),
    senderPhone: z.string().trim().regex(BD_PHONE, errors.senderPhone),
  })
}

export type AdvanceValues = z.infer<ReturnType<typeof buildAdvanceSchema>>

/**
 * The server-side twin of `buildAdvanceSchema`. `placeOrder` is a public HTTP
 * endpoint and has no dictionary in scope, so the messages are English here —
 * they are a last line of defence, not something a shopper should ever read.
 */
export const preorderAdvanceSchema = z.object({
  method: z.enum(['bkash', 'nagad']),
  trxId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,24}$/, 'Enter the transaction ID from your payment app'),
  senderPhone: phoneSchema,
})
