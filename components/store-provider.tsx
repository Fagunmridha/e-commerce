'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Product } from '@/lib/types'
import { useCatalogue } from '@/components/catalogue-provider'
import {
  computeTotals,
  type CouponIssue,
  type PublicCoupon,
} from '@/lib/coupon-math'
import { previewCoupon } from '@/app/actions/coupons'

const CART_KEY = 'cp_cart'
const WISHLIST_KEY = 'cp_wishlist'
const COUPON_KEY = 'cp_coupon'

/**
 * Only the choice is stored — name, price and image are always read back from
 * lib/data, so a catalogue update never leaves stale copies in localStorage.
 */
export type CartLine = {
  productId: string
  quantity: number
  size?: string
  /** English colour name; the label is localized at render time. */
  colorEn?: string
}

/** A cart line joined with its product, ready to render. */
export type ResolvedCartLine = CartLine & {
  key: string
  product: Product
  lineTotal: number
  /** Smallest allowed quantity for this line — 1 for everything house-sold. */
  moq: number
}

function lineKey(line: Pick<CartLine, 'productId' | 'size' | 'colorEn'>) {
  return `${line.productId}::${line.size ?? ''}::${line.colorEn ?? ''}`
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

type StoreContextValue = {
  /** False until localStorage has been read — badges stay blank to avoid a flash. */
  hydrated: boolean
  lines: ResolvedCartLine[]
  itemCount: number
  subtotal: number
  /** Delivery charge in taka — free above the threshold. */
  shipping: number
  /** Preview only. The order's real discount is computed server-side. */
  discount: number
  total: number
  coupon: PublicCoupon | null
  couponError: CouponIssue | null
  /** Resolves true when the code was accepted. */
  applyCoupon: (code: string) => Promise<boolean>
  clearCoupon: () => void
  addToCart: (line: CartLine) => void
  setQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  clearCart: () => void
  wishlist: Product[]
  isWishlisted: (productId: string) => boolean
  /** Returns true when the product ended up in the wishlist. */
  toggleWishlist: (productId: string) => boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { getProductById } = useCatalogue()
  const [hydrated, setHydrated] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [coupon, setCoupon] = useState<PublicCoupon | null>(null)
  const [couponError, setCouponError] = useState<CouponIssue | null>(null)

  useEffect(() => {
    setCart(read<CartLine[]>(CART_KEY, []))
    setWishlistIds(read<string[]>(WISHLIST_KEY, []))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds))
  }, [wishlistIds, hydrated])

  // Wholesale listings carry a minimum order. Clamping here rather than at each
  // call site means every route into the cart — card, quick view, detail page,
  // wishlist — respects it. The server re-checks at checkout regardless.
  const minFor = useCallback(
    (productId: string) => getProductById(productId)?.moq ?? 1,
    [getProductById],
  )

  const addToCart = useCallback(
    (line: CartLine) => {
      const min = minFor(line.productId)

      setCart((current) => {
        const key = lineKey(line)
        const existing = current.find((item) => lineKey(item) === key)

        if (existing) {
          return current.map((item) =>
            lineKey(item) === key
              ? {
                  ...item,
                  quantity: Math.max(item.quantity + line.quantity, min),
                }
              : item,
          )
        }

        return [...current, { ...line, quantity: Math.max(line.quantity, min) }]
      })
    },
    [minFor],
  )

  // Zero still removes the line — "take it out" has to stay reachable even when
  // the minimum is 12. Anything above zero is raised to the minimum instead.
  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      setCart((current) =>
        quantity <= 0
          ? current.filter((item) => lineKey(item) !== key)
          : current.map((item) =>
              lineKey(item) === key
                ? {
                    ...item,
                    quantity: Math.max(quantity, minFor(item.productId)),
                  }
                : item,
            ),
      )
    },
    [minFor],
  )

  const removeLine = useCallback((key: string) => {
    setCart((current) => current.filter((item) => lineKey(item) !== key))
  }, [])

  // A cleared cart releases the coupon too — the next order starts fresh.
  const clearCart = useCallback(() => {
    setCart([])
    setCoupon(null)
    setCouponError(null)
  }, [])

  const toggleWishlist = useCallback((productId: string) => {
    let added = false

    setWishlistIds((current) => {
      added = !current.includes(productId)
      return added
        ? [...current, productId]
        : current.filter((id) => id !== productId)
    })

    return added
  }, [])

  const lines = useMemo<ResolvedCartLine[]>(
    () =>
      cart.flatMap((line) => {
        const product = getProductById(line.productId)
        if (!product) return []

        return [
          {
            ...line,
            key: lineKey(line),
            product,
            lineTotal: product.price * line.quantity,
            moq: product.moq ?? 1,
          },
        ]
      }),
    [cart, getProductById],
  )

  const wishlist = useMemo(
    () => wishlistIds.flatMap((id) => getProductById(id) ?? []),
    [wishlistIds, getProductById],
  )

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  // Read inside callbacks that must not re-create themselves on every cart edit.
  const subtotalRef = useRef(subtotal)
  subtotalRef.current = subtotal

  const applyCoupon = useCallback(async (code: string) => {
    const result = await previewCoupon(code, subtotalRef.current)

    if (result.ok) {
      setCoupon(result.coupon)
      setCouponError(null)
      return true
    }

    setCoupon(null)
    setCouponError(result.reason)
    return false
  }, [])

  const clearCoupon = useCallback(() => {
    setCoupon(null)
    setCouponError(null)
  }, [])

  // Restore the saved code once the cart is known, re-checking it against the
  // server rather than trusting anything in localStorage. Only the code was
  // ever stored — same rule the cart follows.
  useEffect(() => {
    if (!hydrated) return
    const saved = read<string | null>(COUPON_KEY, null)
    if (!saved) return

    let cancelled = false
    void previewCoupon(saved, subtotalRef.current).then((result) => {
      if (cancelled) return
      if (result.ok) setCoupon(result.coupon)
      else window.localStorage.removeItem(COUPON_KEY)
    })

    return () => {
      cancelled = true
    }
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (coupon) window.localStorage.setItem(COUPON_KEY, JSON.stringify(coupon.code))
    else window.localStorage.removeItem(COUPON_KEY)
  }, [coupon, hydrated])

  // Editing the cart below the minimum invalidates the code. Dropping it here
  // rather than at submit means the shopper never sees a discount they will
  // not actually get. The reason is surfaced by the checkout UI, which has the
  // dictionary; the provider deliberately stays language-agnostic.
  useEffect(() => {
    if (!coupon || subtotal <= 0) return
    if (subtotal < coupon.minOrder) {
      setCoupon(null)
      setCouponError('min_order')
    }
  }, [subtotal, coupon])

  const { discount, shipping, total } = computeTotals(subtotal, coupon)

  const value: StoreContextValue = {
    hydrated,
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    couponError,
    applyCoupon,
    clearCoupon,
    addToCart,
    setQuantity,
    removeLine,
    clearCart,
    wishlist,
    isWishlisted: (productId) => wishlistIds.includes(productId),
    toggleWishlist,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)

  if (!context) {
    throw new Error('useStore must be used inside <StoreProvider>')
  }

  return context
}
