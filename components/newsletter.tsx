'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '@/components/layout/container'
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
    <section className="py-3 lg:py-4">
      <Container>
        <Reveal>
          <div className="rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-white/30">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">{copy.title}</h2>
                  <p className="mt-1 max-w-lg text-sm opacity-80">
                    {copy.subtitle}
                  </p>
                </div>
              </div>

              {/* Input and button share one pill, as in the reference. */}
              <form
                onSubmit={onSubmit}
                className="flex w-full max-w-lg overflow-hidden rounded-lg bg-white p-1 lg:w-auto lg:min-w-[26rem]"
              >
                <label className="sr-only" htmlFor="newsletter-email">
                  {copy.placeholder}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.placeholder}
                  className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {copy.cta}
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
