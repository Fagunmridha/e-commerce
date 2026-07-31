'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'

const MAX_SUGGESTIONS = 5

/**
 * Full-width search panel that drops out of the header. Suggestions are matched
 * against the in-memory catalogue, and submitting still routes to /shop?q= so
 * the existing search page keeps owning the real results.
 */
export function SearchPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const { t, pick, price } = useLanguage()
  const { products } = useCatalogue()
  const [term, setTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setTerm('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const query = term.trim().toLowerCase()
  const suggestions = query
    ? products
        .filter((product) => pick(product.name).toLowerCase().includes(query))
        .slice(0, MAX_SUGGESTIONS)
    : []

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!query) return
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="border-t border-border bg-background shadow-card-hover">
      <Container>
        <div className="py-5">
          <form onSubmit={submit} role="search" className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label className="sr-only" htmlFor="site-search">
                {t.header.searchLabel}
              </label>
              <input
                ref={inputRef}
                id="site-search"
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t.header.search}
                className="h-12 w-full rounded-full border border-border bg-secondary/60 pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
              />
            </div>
            {/* Phones don't have room for input + submit + close on one row;
                there the leading icon and the Enter key carry the submit. */}
            <button
              type="submit"
              className="hidden h-12 rounded-full bg-button px-6 text-xs font-bold tracking-wide text-button-foreground uppercase transition-colors hover:bg-button/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:block"
            >
              {t.header.searchSubmit}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="grid size-12 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <X className="size-5" />
            </button>
          </form>

          {suggestions.length > 0 && (
            <ul className="mt-4 grid gap-1.5">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      <Image
                        src={product.image || '/placeholder.svg'}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {pick(product.name)}
                      </span>
                      <span className="block text-sm font-semibold text-primary">
                        {price(product.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  )
}
