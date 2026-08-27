'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Lock, ShieldCheck, ShoppingBag, Store, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
 * under a two-choice dialog that opens over them.
 *
 * Showing the stock before anyone has joined is the point — the old pitch page
 * listed nothing, and asked people to fill in a trade application on the
 * strength of a promise. What is *not* given away is the trade price: the
 * figures are blurred until a side is chosen, so a competitor cannot read the
 * price list off a public page. Everything else about a listing is fair game.
 *
 * The chooser is a centred dialog rather than a banner above the grid, so the
 * listings it unlocks sit right behind it instead of being pushed under the
 * fold by it. It is dismissable: the two memberships are worth a modal on
 * arrival, but not at the cost of a visitor who wants to scroll the stock
 * first, so ✕/Esc/backdrop all let the grid through and every locked card
 * brings the dialog straight back.
 *
 * The two options are stacked bars. They are not two ways of doing one thing —
 * they are two different memberships, one of them irreversible — so each bar
 * says what it gets you under its own label.
 *
 * Nothing in the grid is a link. A locked card is a `<button>` whose only job
 * is to reopen the chooser, which keeps the whole grid reachable by keyboard
 * and stops a middle-click from smuggling anyone onto a product page.
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
  // Open on arrival, except on the way back from sign-in: `resumeJoin` fires
  // the join itself on mount and navigates away, so opening the chooser there
  // would only flash it at someone who has already chosen.
  const [open, setOpen] = useState(!resumeJoin)

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
      {/* The chooser, centred over the grid it unlocks. `DialogContent` is
          already `fixed` and translated to the middle of the viewport, so the
          listings stay exactly where they were and the panel floats on top of
          them — no layout of our own to fight with the grid's. */}
      <Dialog
        open={open}
        // Closing mid-join would suggest the server action stopped with it.
        // It has not, and the redirect that follows would then arrive out of
        // nowhere.
        onOpenChange={(next) => {
          if (!pending) setOpen(next)
        }}
      >
        <DialogContent
          showCloseButton={false}
          // A light scrim rather than the default `bg-black/50`: the panel is
          // translucent, and half-black behind it turns the glass grey. The
          // faint blur here is what separates the panel's own heavy blur from
          // the sharp grid at the edges of the screen.
          overlayClassName="bg-foreground/20 backdrop-blur-[2px]"
          className={cn(
            'gap-0 overflow-hidden rounded-3xl border-white/70 p-0 sm:max-w-md',
            // The glass itself. `saturate` is the half that keeps it from
            // reading as frosted plastic — the product photos behind it stay
            // colourful through the blur instead of washing out.
            'bg-card/70 backdrop-blur-2xl backdrop-saturate-150',
            'shadow-float',
          )}
        >
          {/* The lit top edge and the bloom behind it — the two things that
              make a translucent panel read as glass rather than as a card
              someone forgot to give an opacity of 1. Both clipped by the
              `overflow-hidden` above, so the bloom fades into the corners. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 size-52 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative px-6 pt-8 pb-6">
            {/* Ours rather than the built-in one: that close button's only
                label is a hardcoded English `sr-only` string, and everything
                else on this page comes out of the dictionary. */}
            <DialogClose
              className={cn(
                'absolute top-4 right-4 rounded-full border border-white/70 bg-card/60 p-1.5 text-muted-foreground backdrop-blur-md transition-colors',
                'hover:bg-card hover:text-foreground',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
              disabled={pending}
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">{copy.close}</span>
            </DialogClose>

            <DialogHeader className="text-center sm:text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-button text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/40">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <DialogTitle className="mt-1 text-xl font-bold tracking-tight">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="leading-relaxed text-balance">
                {copy.subtitle}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-col gap-3">
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
        </DialogContent>
      </Dialog>

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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {visible.length} {t.category.itemsFound}
                </p>
                {/* The way back once the dialog has been dismissed. Kept to a
                    text button on purpose — the bars belong in the dialog now,
                    and a second full-width pair here would be the banner this
                    change removed. */}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="rounded-sm text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {copy.reopenCta}
                </button>
              </div>
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
                    onClick={() => setOpen(true)}
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
        'group relative flex w-full items-center gap-3 rounded-2xl border py-3.5 pr-11 pl-3.5 text-left shadow-card backdrop-blur-md transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-60 disabled:hover:translate-y-0',
        // The featured bar is tinted rather than merely outlined: on a glass
        // panel a border alone is the one thing the blur behind it eats.
        featured
          ? 'border-primary/40 bg-gradient-to-r from-primary/12 via-card/85 to-card/85'
          : 'border-white/70 bg-card/70 hover:border-primary/30',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
          featured
            ? 'bg-gradient-to-br from-primary to-button text-button-foreground shadow-md shadow-primary/25 ring-1 ring-white/30'
            : 'bg-secondary/80 text-foreground group-hover:bg-accent group-hover:text-accent-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>

      {/* Label over hint rather than on one line. The bar is now inside a
          `max-w-md` dialog, where the Bengali labels alone fill the width —
          the old single line with a `truncate` would eat the hint on every
          viewport, not just the narrow ones. */}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm leading-snug font-semibold text-foreground">
          {label}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">{hint}</span>
      </span>

      {/* Out of the flow and pinned right, so a long hint wraps under the
          label rather than around the arrow. The bar's `pr-11` is what leaves
          it room. */}
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
