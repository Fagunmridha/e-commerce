'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Lock, ShieldCheck, ShoppingBag, Store } from 'lucide-react'
import { toast } from 'sonner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { CatalogueFilter } from '@/components/catalogue-filter'
import { useLanguage } from '@/components/language-provider'
import { chooseWholesaleRole } from '@/app/actions/wholesale'
import { cn } from '@/lib/utils'
import type { Catalogue, Category, Product } from '@/lib/types'
import type { WholesaleRole } from '@/lib/db/schema'

/**
 * The front door of the wholesale programme: the listings, visible but inert,
 * under a slim two-choice hero.
 *
 * Showing the stock before anyone has joined is the point — the old pitch page
 * listed nothing, and asked people to fill in a trade application on the
 * strength of a promise. What is *not* given away is the trade price: the
 * figures are blurred until a side is chosen, so a competitor cannot read the
 * price list off a public page. Everything else about a listing is fair game.
 *
 * The two options are slim full-width bars, stacked. They are not two ways of
 * doing one thing — they are two different memberships, one of them
 * irreversible — so each bar still says what it gets you, on the same line as
 * its label. Anything taller than that pushes the grid under the fold to
 * repeat what the line above the bars already said.
 *
 * Nothing in the grid is a link. A locked card is a `<button>` whose only job
 * is to say "pick a side first", which keeps the whole grid reachable by
 * keyboard and stops a middle-click from smuggling anyone onto a product page.
 */
export function WholesaleJoin({
  products,
  categories,
  catalogues,
  signedIn,
  resumeJoin,
}: {
  products: Product[]
  categories: Category[]
  catalogues: Catalogue[]
  /** Drives whether a choice joins outright or detours through sign-in. */
  signedIn: boolean
  /** The side they picked before being sent to sign in, replayed on return. */
  resumeJoin?: WholesaleRole
}) {
  const { t, pick, price } = useLanguage()
  const copy = t.wholesale.join
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [choosing, setChoosing] = useState<WholesaleRole | null>(null)
  const [category, setCategory] = useState('')
  const [catalogue, setCatalogue] = useState('')

  const join = useCallback(
    (role: WholesaleRole) => {
      setChoosing(role)

      if (!signedIn) {
        // The chosen side rides along in the return URL, so signing in lands
        // back here and finishes the join rather than dropping them at the
        // chooser again with nothing to show for the detour.
        toast.info(copy.signInFirst)
        const back = encodeURIComponent(`/wholesale?join=${role}`)
        router.push(`/sign-in?redirect_url=${back}`)
        return
      }

      startTransition(async () => {
        const result = await chooseWholesaleRole(role)
        if (!result.ok) {
          setChoosing(null)
          toast.error(result.error)
          return
        }
        // A seller has only opened their application; a buyer is done.
        if (result.role === 'seller') {
          router.push('/wholesale/apply')
        } else {
          toast.success(copy.joinedBuyer)
          router.push('/wholesale/market')
        }
        router.refresh()
      })
    },
    [signedIn, router, copy.signInFirst, copy.joinedBuyer],
  )

  // Finish a join that was interrupted by sign-in. The ref is what keeps this
  // to one attempt: `join` navigates, and a re-render before the new route
  // lands would otherwise fire it a second time.
  const resumed = useRef(false)
  useEffect(() => {
    if (!resumeJoin || resumed.current) return
    resumed.current = true
    join(resumeJoin)
  }, [resumeJoin, join])

  const visible = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!catalogue || product.catalogue === catalogue),
  )

  return (
    <>
      {/* The chooser. On the tinted surface rather than the page ground, so it
          reads as one panel above the grid instead of drifting in white.
          Deliberately shallow, and with no heading of its own: `PageHeader`
          directly above already says "Wholesale", and repeating it here would
          push the listings — the reason anyone stays on this page — under the
          fold to say nothing new. */}
      <section className="border-b border-border bg-surface">
        {/* Same container and gutters as the grid below, so the bars run the
            exact width of the listings they unlock rather than sitting in a
            column of their own. At this width the hint never hits the bar's
            `truncate` on desktop. */}
        <div className="mx-auto max-w-page px-4 py-5 sm:px-6 sm:py-6 lg:px-4">
          <p className="flex items-start justify-center gap-2 text-center text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="max-w-3xl">{copy.subtitle}</span>
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            <ChoiceBar
              Icon={ShoppingBag}
              label={copy.buyerCta}
              hint={copy.buyerHint}
              featured
              loading={pending && choosing === 'buyer'}
              disabled={pending}
              onSelect={() => join('buyer')}
            />
            <ChoiceBar
              Icon={Store}
              label={copy.sellerCta}
              hint={copy.sellerHint}
              loading={pending && choosing === 'seller'}
              disabled={pending}
              onSelect={() => join('seller')}
            />
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-4">
          <Empty className="rounded-xl border border-border">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          {/* Toolbar. The count sits opposite the filters so the row has two
              ends rather than one lonely dropdown — same shape the category
              pages use, which is where a shopper has just come from. */}
          <div className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-4">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {visible.length} {t.category.itemsFound}
              </p>
              {/* Filtering is not gated — narrowing a locked grid tells nobody
                  anything they could not learn by scrolling it. */}
              <CatalogueFilter
                categories={categories}
                catalogues={catalogues}
                category={category}
                catalogue={catalogue}
                onCategoryChange={setCategory}
                onCatalogueChange={setCatalogue}
                available={products}
              />
            </div>
          </div>

          <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-10 lg:px-4">
            {visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {t.wholesale.market.noResults}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((product, index) => (
                  <LockedCard
                    key={product.id}
                    name={pick(product.name)}
                    image={product.image}
                    price={price(product.price)}
                    lockedLabel={copy.lockedBadge}
                    // Only the first row is above the fold; the rest stay lazy.
                    priority={index < 4}
                    onClick={() => toast.info(copy.lockedNotice)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

/**
 * One of the two memberships, as a bar you press.
 *
 * `featured` tints the buyer's bar. Not a recommendation — it marks the path
 * that costs nothing and completes immediately, so the two options read as
 * genuinely different commitments rather than a coin toss.
 */
function ChoiceBar({
  Icon,
  label,
  hint,
  featured = false,
  loading,
  disabled,
  onSelect,
}: {
  Icon: typeof Store
  label: string
  hint: string
  featured?: boolean
  loading: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-busy={loading}
      className={cn(
        'group relative flex w-full items-center justify-center gap-3 rounded-lg border bg-card px-12 py-3 text-center shadow-card transition-colors',
        'hover:border-primary/40 hover:bg-accent/40',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-60',
        featured ? 'border-primary/35' : 'border-border',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors',
          featured
            ? 'bg-button text-button-foreground'
            : 'bg-secondary text-foreground group-hover:bg-accent group-hover:text-accent-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      {/* Label and hint on one line. `truncate` is what keeps the bar slim:
          a long Bengali label would otherwise wrap and undo the whole shape.
          The hint is the half that goes first — below `sm` there is no room
          for it, and the line above the bars covers the same ground. */}
      <span className="min-w-0 truncate text-sm leading-snug font-semibold text-foreground sm:text-base">
        {label}
        <span className="hidden font-normal text-muted-foreground sm:inline">
          {' · '}
          {hint}
        </span>
      </span>

      {/* Out of the flow and pinned right, so the icon and label stay centred
          on the bar rather than being pushed off-centre by the arrow's width.
          The matching `px-12` on both sides is what leaves it room. */}
      <ArrowRight
        className={cn(
          'absolute right-4 size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1',
          featured ? 'text-primary' : 'text-muted-foreground',
          loading && 'animate-pulse',
        )}
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * A listing with everything switched off.
 *
 * The lock is stated three ways because one is not enough: a badge names the
 * state, a scrim on hover says the card is not going anywhere, and the price
 * is blurred. That last one is `select-none` and `aria-hidden` so the figure
 * is neither copyable nor read out — a screen reader announcing it would undo
 * the blur entirely, and the card carries no other trade secret.
 */
function LockedCard({
  name,
  image,
  price,
  lockedLabel,
  priority,
  onClick,
}: {
  name: string
  image: string
  price: string
  lockedLabel: string
  priority: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Sits above the image at all times so the grid reads as locked at a
            glance, rather than only once something is hovered. */}
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-foreground/85 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur-sm">
          <Lock className="size-3" aria-hidden="true" />
          {lockedLabel}
        </span>

        <span
          aria-hidden="true"
          className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/25"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          {name}
        </span>
        <span
          aria-hidden="true"
          className="mt-auto w-fit text-base font-bold text-foreground/70 blur-[6px] select-none"
        >
          {price}
        </span>
      </div>
    </button>
  )
}
