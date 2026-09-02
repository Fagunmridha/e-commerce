'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Headset,
  Heart,
  Info,
  Package,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { chooseWholesaleRole } from '@/app/actions/wholesale'
import { getDictionary, type Dictionary } from '@/lib/dictionaries'
import { cn } from '@/lib/utils'
import type { Catalogue, Category, Product } from '@/lib/types'
import type { WholesaleRole } from '@/lib/db/schema'

/** The catalogue filter for stock in a category that has none set. */
const UNSORTED = '__unsorted__'

/** In the order of `t.wholesale.landing.perks`. */
const PERK_ICONS = [ShieldCheck, Truck, CreditCard, Headset] as const

/**
 * The front door of the wholesale programme, for anyone who has not picked a
 * side yet: a hero, the two memberships as cards, and the catalogue below them.
 *
 * It replaced a dialog that opened over the listings on arrival. The listings
 * were the point of that page and the modal was standing in front of them —
 * the two memberships now sit above the grid as the first thing on the page,
 * where they can be read rather than dismissed, and the grid below is scrolled
 * without anything to get past first.
 *
 * The two are not two ways of doing one thing. They are different memberships,
 * one of them irreversible, so each card says what it gets you under its own
 * numbered label, and the second card carries its own colour rather than being
 * a paler copy of the first.
 *
 * Every card in the grid is inert: nothing links to a product page, and both
 * the card's button and its heart scroll back up to the choice instead. That
 * keeps the whole grid reachable by keyboard and stops a middle-click from
 * smuggling anyone onto a detail page they have not joined for.
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
  const { t, locale, pick, price } = useLanguage()
  const copy = t.wholesale.landing
  const roles = t.wholesale.join
  // The same two role names in the other language, as the second line of each
  // card. The audience reads trade terms in both, and the pair is what makes
  // the two memberships unmistakable to someone who only knows one of the words.
  const altCopy = getDictionary(locale === 'bn' ? 'en' : 'bn').wholesale.landing

  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [choosing, setChoosing] = useState<WholesaleRole | null>(null)

  const join = useCallback(
    (role: WholesaleRole) => {
      setChoosing(role)

      if (!signedIn) {
        // The chosen side rides along in the return URL, so signing in lands
        // back here and finishes the join rather than dropping them at the
        // choice again with nothing to show for the detour.
        toast.info(roles.signInFirst)
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
          toast.success(roles.joinedBuyer)
          router.push('/wholesale/market')
        }
        router.refresh()
      })
    },
    [signedIn, router, roles.signInFirst, roles.joinedBuyer],
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

  // Where every locked control sends you. A counter rather than a boolean so a
  // second click while the ring is still up restarts it — with a boolean the
  // effect would not re-run, and the ring would fade on the first click's clock.
  const joinRef = useRef<HTMLElement>(null)
  const [flash, setFlash] = useState(0)

  const gate = useCallback(() => {
    joinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setFlash((count) => count + 1)
  }, [])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(0), 1600)
    return () => window.clearTimeout(timer)
  }, [flash])

  const [category, setCategory] = useState('')
  const [catalogue, setCatalogue] = useState('')

  // Only categories with wholesale stock behind them, so no tab can empty the
  // grid. Same rule the shared `CatalogueFilter` keeps for its dropdowns.
  const usableCategories = useMemo(
    () =>
      categories.filter((item) =>
        products.some((product) => product.category === item.slug),
      ),
    [categories, products],
  )

  // The sidebar tree: a category, then the catalogues under it that have stock,
  // plus an "Others" row where the category holds anything unsorted.
  const groups = useMemo(
    () =>
      usableCategories.map((item) => {
        const inCategory = products.filter(
          (product) => product.category === item.slug,
        )

        const branches = catalogues
          .filter(
            (entry) =>
              entry.categorySlug === item.slug &&
              inCategory.some((product) => product.catalogue === entry.slug),
          )
          .map((entry) => ({ value: entry.slug, label: pick(entry.name) }))

        return {
          slug: item.slug,
          label: pick(item.name),
          branches: inCategory.some((product) => !product.catalogue)
            ? [...branches, { value: UNSORTED, label: copy.otherCatalogue }]
            : branches,
        }
      }),
    [usableCategories, catalogues, products, pick, copy.otherCatalogue],
  )

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const selectCategory = useCallback((slug: string) => {
    setCategory(slug)
    // The old catalogue almost certainly belongs to the category being left.
    setCatalogue('')
  }, [])

  const selectCatalogue = useCallback(
    (categorySlug: string, value: string) => {
      // Clicking the row you are already on clears it, which is the only way
      // back to the whole category without going via the tabs.
      const same = category === categorySlug && catalogue === value
      setCategory(same ? '' : categorySlug)
      setCatalogue(same ? '' : value)
    },
    [category, catalogue],
  )

  const visible = products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!catalogue ||
        (catalogue === UNSORTED
          ? !product.catalogue
          : product.catalogue === catalogue)),
  )

  return (
    <>
      {/* `scroll-mt-24` clears the sticky header — `gate()` below scrolls here,
          and without it the bar lands on top of the heading. */}
      <section
        ref={joinRef}
        className="scroll-mt-24 border-b border-border bg-muted/50"
      >
        <Container className="py-10 sm:py-12">
          <div className="text-center">
            {/* The page dropped `PageHeader` for this hero, and took the
                breadcrumb with it. It comes back here rather than as a second
                band above the hero. */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
            >
              <Link href="/" className="transition-colors hover:text-primary">
                {t.common.home}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="text-foreground">{t.pages.wholesale.breadcrumb}</span>
            </nav>

            <h1 className="mt-3 text-display-sm text-foreground">
              {copy.heroTitle}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-balance text-muted-foreground sm:text-base">
              {copy.heroSubtitle}
            </p>
          </div>

          {/* Full container width, matching the product grid below — the pair
              used to sit in a narrower measure of its own, which is what made
              the page read as two layouts stacked. */}
          <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
            <JoinCard
              step="1"
              Icon={ShoppingCart}
              featured
              role={copy.buyerRole}
              altRole={altCopy.buyerRole}
              body={copy.buyerBody}
              action={copy.buyerAction}
              flash={flash > 0}
              loading={pending && choosing === 'buyer'}
              disabled={pending}
              onSelect={() => join('buyer')}
            />
            <JoinCard
              step="2"
              Icon={Package}
              role={copy.sellerRole}
              altRole={altCopy.sellerRole}
              body={copy.sellerBody}
              // The seller does not join, they apply — the store has to approve
              // the shop first. The two buttons say so rather than pretending
              // the paths are the same length.
              action={t.wholesale.applyCta}
              flash={flash > 0}
              loading={pending && choosing === 'seller'}
              disabled={pending}
              onSelect={() => join('seller')}
            />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-10 sm:py-12">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              {roles.badge}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {copy.browseTitle}
            </h2>
          </div>

          {products.length === 0 ? (
            <Empty className="mt-8 rounded-xl border border-border">
              <EmptyHeader>
                <EmptyTitle>{roles.emptyTitle}</EmptyTitle>
                <EmptyDescription>{roles.emptyBody}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              {/* Category tabs. On phones these are the only filter — the
                  catalogue tree is a desktop affordance, and stacking it above
                  the grid would push the stock a full screen down. */}
              <div className="mt-6 flex justify-center">
                <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-border bg-muted/70 p-1">
                  <Tab active={!category} onSelect={() => selectCategory('')}>
                    {copy.allProducts}
                  </Tab>
                  {usableCategories.map((item) => (
                    <Tab
                      key={item.slug}
                      active={category === item.slug}
                      onSelect={() => selectCategory(item.slug)}
                    >
                      {pick(item.name)}
                    </Tab>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <h3 className="border-b border-border px-4 py-3 text-xs font-bold tracking-wider text-primary uppercase">
                      {copy.catalogueHeading}
                    </h3>
                    <div className="divide-y divide-border">
                      {groups.map((group) => (
                        <div key={group.slug}>
                          <button
                            type="button"
                            aria-expanded={!collapsed[group.slug]}
                            onClick={() =>
                              setCollapsed((current) => ({
                                ...current,
                                [group.slug]: !current[group.slug],
                              }))
                            }
                            className="flex w-full items-center gap-2 px-4 py-3 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            <Users
                              className="size-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground uppercase">
                              {group.label}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                                collapsed[group.slug] && '-rotate-90',
                              )}
                            />
                          </button>

                          {!collapsed[group.slug] && group.branches.length > 0 && (
                            <ul className="pb-2">
                              {group.branches.map((branch) => {
                                const active =
                                  category === group.slug &&
                                  catalogue === branch.value

                                return (
                                  <li key={branch.value}>
                                    <button
                                      type="button"
                                      aria-pressed={active}
                                      onClick={() =>
                                        selectCatalogue(group.slug, branch.value)
                                      }
                                      className={cn(
                                        'flex w-full items-center gap-2 py-1.5 pr-4 pl-6 text-left text-sm transition-colors',
                                        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                        active
                                          ? 'font-semibold text-primary'
                                          : 'text-muted-foreground hover:text-primary',
                                      )}
                                    >
                                      <ArrowRight
                                        className="size-3 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <span className="min-w-0 truncate">
                                        {branch.label}
                                      </span>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <div>
                  {visible.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {t.wholesale.market.noResults}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                      {visible.map((product, index) => (
                        <LockedCard
                          key={product.id}
                          name={pick(product.name)}
                          image={product.image}
                          price={price(product.price)}
                          moq={product.moq}
                          copy={copy}
                          // Only the first row is above the fold once the hero
                          // is scrolled past; the rest stay lazy.
                          priority={index < 4}
                          onGate={gate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* What every locked control on the page is explaining. It sits
                  under the grid as well as at the top, so someone who scrolled
                  the whole catalogue does not have to go back up to act. */}
              <div className="mt-10 rounded-xl border border-border bg-muted/40 px-6 py-8 text-center">
                <p className="flex items-center justify-center gap-2 text-base font-bold text-foreground">
                  <Info className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  {copy.gateTitle}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{copy.gateBody}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button disabled={pending} onClick={() => join('buyer')}>
                    {roles.buyerCta}
                  </Button>
                  <Button
                    disabled={pending}
                    onClick={() => join('seller')}
                    className="bg-button-warm text-button-warm-foreground hover:bg-button-warm/90"
                  >
                    {roles.sellerCta}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Container>
      </section>

      <section className="border-t border-border bg-muted/40">
        <Container className="py-8">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.perks.map((perk, index) => {
              const Icon = PERK_ICONS[index]

              return (
                <Reveal
                  as="li"
                  key={perk.title}
                  delay={index * 80}
                  className="flex items-start gap-3"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-primary">{perk.title}</h3>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {perk.body}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </ul>
        </Container>
      </section>
    </>
  )
}

/**
 * One of the two memberships.
 *
 * `featured` is the buyer's card. Not a recommendation — it marks the path that
 * costs nothing and completes immediately, so the two read as genuinely
 * different commitments rather than a coin toss.
 */
function JoinCard({
  step,
  Icon,
  role,
  altRole,
  body,
  action,
  featured = false,
  flash,
  loading,
  disabled,
  onSelect,
}: {
  step: string
  Icon: typeof Package
  /** The membership as a noun — the card's heading. */
  role: string
  /** The same noun in the other language. */
  altRole: string
  body: string
  /** The button. Never the same words as `role`, which is right above it. */
  action: string
  featured?: boolean
  /** Lit briefly when a locked control below has just scrolled here. */
  flash: boolean
  loading: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-6 py-7 text-center transition-shadow duration-300',
        featured
          ? 'border-primary/20 bg-accent/60'
          : 'border-accent-warm-foreground/20 bg-accent-warm',
        flash && 'ring-2 ring-offset-2 ring-offset-background',
        flash && (featured ? 'ring-primary/60' : 'ring-button-warm/60'),
      )}
    >
      {/* The measure, not the card. The card spans half the page so it lines up
          with the grid below; the reading column inside stays a column. */}
      <div className="mx-auto max-w-md">
        {/* Icon beside the heading rather than on its own row above it — one
            row saved is most of the height this card used to spend, and the
            centred column survives it. */}
        <div className="flex items-center justify-center gap-3">
          <span
            className={cn(
              'grid size-12 shrink-0 place-items-center rounded-full',
              featured
                ? 'bg-primary/12 text-primary'
                : 'bg-button-warm/15 text-accent-warm-foreground',
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="min-w-0 text-lg font-bold text-balance text-foreground sm:text-xl">
            {step}. {role}
          </h2>
        </div>

        <p className="mt-2 text-xs font-medium tracking-wide text-foreground/60">
          {altRole}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>

        <Button
          disabled={disabled}
          aria-busy={loading}
          onClick={onSelect}
          className={cn(
            'mt-5',
            !featured &&
              'bg-button-warm text-button-warm-foreground hover:bg-button-warm/90',
          )}
        >
          {action}
          <ArrowRight
            aria-hidden="true"
            className={cn('transition-transform', loading && 'animate-pulse')}
          />
        </Button>
      </div>
    </div>
  )
}

function Tab({
  active,
  onSelect,
  children,
}: {
  active: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'bg-button text-button-foreground shadow-card'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/**
 * A listing with everything switched off.
 *
 * Nothing here is a link. The button and the heart both scroll back to the two
 * memberships, which is the only thing either can do before a side is picked —
 * the heart says so in its label rather than pretending to save anything.
 */
function LockedCard({
  name,
  image,
  price,
  moq,
  copy,
  priority,
  onGate,
}: {
  name: string
  image: string
  price: string
  moq?: number
  copy: Dictionary['wholesale']['landing']
  priority: boolean
  onGate: () => void
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <span className="absolute top-2.5 left-2.5 rounded-md bg-button px-2 py-1 text-[11px] font-semibold text-button-foreground">
          {copy.wholesaleBadge}
        </span>

        <button
          type="button"
          onClick={onGate}
          title={copy.saveHint}
          aria-label={copy.saveHint}
          className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground shadow-card backdrop-blur-sm transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Heart className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          {name}
        </h3>

        <p className="mt-2">
          <span className="text-base font-bold text-foreground">{price}</span>{' '}
          <span className="text-xs text-muted-foreground">{copy.perPiece}</span>
        </p>

        {moq !== undefined && (
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.moq.replace('{count}', String(moq))}
          </p>
        )}

        <Button size="sm" onClick={onGate} className="mt-4 w-full">
          {copy.viewProduct}
        </Button>
      </div>
    </div>
  )
}
