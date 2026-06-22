'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartDrawer } from '@/components/cart-drawer'

export function Navigation() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeMega, setActiveMega] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const megaMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveMega(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const categories = {
    Men: [
      { name: 'T-Shirts', href: '#' },
      { name: 'Shirts', href: '#' },
      { name: 'Jackets', href: '#' },
      { name: 'Trousers', href: '#' },
    ],
    Women: [
      { name: 'Dresses', href: '#' },
      { name: 'Tops', href: '#' },
      { name: 'Jackets', href: '#' },
      { name: 'Bottoms', href: '#' },
    ],
    Accessories: [
      { name: 'Bags', href: '#' },
      { name: 'Belts', href: '#' },
      { name: 'Scarves', href: '#' },
      { name: 'Jewelry', href: '#' },
    ],
    About: [
      { name: 'Our Story', href: '#' },
      { name: 'Sustainability', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'FAQs', href: '#' },
    ],
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
              LS
            </div>
            <span className="hidden sm:inline font-semibold text-foreground">Luxe</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1" ref={megaMenuRef}>
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="relative group">
                <button
                  onClick={() => setActiveMega(activeMega === category ? null : category)}
                  className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {category}
                </button>

                {/* Mega Menu Dropdown */}
                {activeMega === category && (
                  <div className="absolute left-0 mt-0 w-48 bg-card rounded-lg shadow-lg border border-border p-4 animate-in fade-in-0 zoom-in-95 duration-200">
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="relative hidden sm:block">
              {isSearchOpen && (
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-32 lg:w-48"
                  onBlur={() => setIsSearchOpen(false)}
                  autoFocus
                />
              )}
              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5 text-foreground" />
                </button>
              )}
            </div>

            {/* Cart */}
            <CartDrawer />

            {/* Mobile Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category}>
                <button
                  onClick={() => setActiveMega(activeMega === category ? null : category)}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {category}
                </button>
                {activeMega === category && (
                  <div className="pl-4 space-y-1">
                    {items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-3 py-2 text-xs text-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
