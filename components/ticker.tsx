'use client'

import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

/** Scrolling offer strip — the content is rendered twice so the loop is seamless. */
export function Ticker() {
  const { t } = useLanguage()
  const items = [...t.ticker, ...t.ticker]

  return (
    <div className="overflow-hidden border-y border-border bg-foreground py-3 text-background">
      <div className="flex w-max animate-marquee items-center gap-10 pr-10">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center gap-3 text-xs font-bold tracking-[0.16em] whitespace-nowrap uppercase"
            aria-hidden={index >= t.ticker.length}
          >
            <Sparkles className="size-3.5 text-primary" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
