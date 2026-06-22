'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Trash2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ProductCard, type ProductCardProps } from '@/components/product-card'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
  image: string
}

const RECOMMENDATIONS: ProductCardProps[] = [
  {
    id: 'rec-1',
    name: 'Sustainable Canvas Bag',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop',
    badges: ['eco-friendly'],
  },
  {
    id: 'rec-2',
    name: 'Organic Cotton Socks Pack',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1556821552-5dcb2e6acb84?w=500&h=500&fit=crop',
    badges: ['sustainable'],
  },
]

export function CartDrawer() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Organic Cotton Oversized Tee',
      price: 89.99,
      quantity: 1,
      size: 'M',
      color: 'Oat',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    },
  ])

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = cartItems.length > 0 ? 0 : 0
  const total = subtotal + shipping

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Open cart">
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {cartItems.length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
              {cartItems.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-2xl">Shopping Bag</SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <svg
              className="w-16 h-16 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-muted-foreground">Your bag is empty</p>
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-border pb-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' • '}
                        {item.color && `Color: ${item.color}`}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto p-1 hover:bg-destructive/10 rounded transition-colors text-destructive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* You May Also Like */}
              {cartItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-4">You May Also Like</h3>
                  <div className="space-y-3">
                    {RECOMMENDATIONS.map((product) => (
                      <div
                        key={product.id}
                        className="flex gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-sm text-primary font-semibold mt-1">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-foreground text-lg">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
              <Button className="w-full">
                Proceed to Checkout
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
