'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

export function Newsletter() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')

  const copy = t.home.newsletter

  // No mailing-list API yet, so this only acknowledges the address locally.
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(copy.error)
      return
    }

    toast.success(copy.success, { description: copy.successHint })
    setEmail('')
  }

  return (
    <section className="mx-auto max-w-page px-4 pb-16 sm:px-6 lg:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-white/10 blur-2xl"
          />

          <div className="relative mx-auto max-w-xl text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/15">
              <Mail className="size-5" />
            </span>
            <p className="mt-5 text-[11px] font-bold tracking-[0.18em] uppercase opacity-80">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 text-display-sm">{copy.title}</h2>
            <p className="mt-3 text-sm opacity-85">{copy.subtitle}</p>

            <form
              onSubmit={onSubmit}
              className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                {copy.placeholder}
              </label>
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.placeholder}
                className="h-12 flex-1 border-transparent bg-white text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 gap-2 bg-foreground px-7 font-bold tracking-wide uppercase hover:bg-foreground/90"
              >
                {copy.cta}
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
