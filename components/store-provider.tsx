'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Product } from '@/lib/types'
import { useCatalogue } from '@/components/catalogue-provider'
import { getShippingCost } from '@/lib/currency'

const CART_KEY = 'cp_cart'
const WISHLIST_KEY = 'cp_wishlist'

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
  /** Delivery charge in USD — free above the threshold. */
  shipping: number
  total: number
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

  const addToCart = useCallback((line: CartLine) => {
    setCart((current) => {
      const key = lineKey(line)
      const existing = current.find((item) => lineKey(item) === key)

      if (existing) {
        return current.map((item) =>
          lineKey(item) === key
            ? { ...item, quantity: item.quantity + line.quantity }
            : item,
        )
      }

      return [...current, line]
    })
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => lineKey(item) !== key)
        : current.map((item) =>
            lineKey(item) === key ? { ...item, quantity } : item,
          ),
    )
  }, [])

  const removeLine = useCallback((key: string) => {
    setCart((current) => current.filter((item) => lineKey(item) !== key))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

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
  const shipping = getShippingCost(subtotal)

  const value: StoreContextValue = {
    hydrated,
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
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
