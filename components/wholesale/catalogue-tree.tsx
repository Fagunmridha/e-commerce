'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Catalogue, Category, Product } from '@/lib/types'

/** The catalogue filter for stock in a category that has none set. */
export const UNSORTED = '__unsorted__'

type Branch = { value: string; label: string; count: number }
type Node = { slug: string; label: string; branches: Branch[]; count: number }
type Group = {
  slug: string
  label: string
  /** Listings behind this row — the number beside the name. */
  count: number
  /** The categories under this trade line. Empty when the line has none. */
  categories: Node[]
  /** Catalogues hanging off the line itself — only when it has no categories. */
  branches: Branch[]
}

/**
 * The trade catalogue as a tree: a line, the categories under it, and the
 * catalogues under those.
 *
 * Shared by /wholesale and /wholesale/market so the locked front door and the
 * page that actually sells show the same shape. Selection is controlled,
 * because both pages already hold that state to filter their grid with; only
 * which branches are folded belongs to the tree.
 *
 * A line with no categories of its own renders its catalogues directly, which
 * is the two-level shape this had before lines existed — so a store that never
 * groups anything sees no change.
 *
 * Every level is narrowed to what has stock behind it, the rule the shared
 * `CatalogueFilter` keeps for its dropdowns: no row here can empty the grid.
 */
/**
 * How many listings sit behind a row.
 *
 * `tabular-nums` so a column of them does not jitter as the filter changes the
 * widths, and `shrink-0` so the count never gets squeezed out by a long name —
 * it is the name that truncates.
 */
function Count({ n }: { n: number }) {
  return (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      ({n})
    </span>
  )
}

export function CatalogueTree({
  categories,
  catalogues,
  products,
  category,
  catalogue,
  onCategoryChange,
  onCatalogueChange,
}: {
  categories: Category[]
  catalogues: Catalogue[]
  products: Product[]
  category: string
  catalogue: string
  onCategoryChange: (slug: string) => void
  onCatalogueChange: (slug: string) => void
}) {
  const { t, pick } = useLanguage()
  const copy = t.wholesale.landing

  const groups = useMemo<Group[]>(() => {
    const branchesFor = (slug: string): Branch[] => {
      const inCategory = products.filter((product) => product.category === slug)
      if (inCategory.length === 0) return []

      const found = catalogues
        .filter(
          (entry) =>
            entry.categorySlug === slug &&
            inCategory.some((product) => product.catalogue === entry.slug),
        )
        .map((entry) => ({
          value: entry.slug,
          label: pick(entry.name),
          count: inCategory.filter((product) => product.catalogue === entry.slug)
            .length,
        }))

      const loose = inCategory.filter((product) => !product.catalogue)
      return loose.length > 0
        ? [
            ...found,
            {
              value: UNSORTED,
              label: copy.otherCatalogue,
              count: loose.length,
            },
          ]
        : found
    }

    const countIn = (slug: string) =>
      products.filter((product) => product.category === slug).length

    const lines = categories.filter((item) => item.parentSlug === null)

    return lines
      .map((line) => {
        const children = categories
          .filter((item) => item.parentSlug === line.slug)
          .map((item) => ({
            slug: item.slug,
            label: pick(item.name),
            count: countIn(item.slug),
            branches: branchesFor(item.slug),
          }))
          .filter((item) => item.count > 0)

        return {
          slug: line.slug,
          label: pick(line.name),
          // A line's own total is its children's, plus anything filed straight
          // on it — which is what a childless line holds.
          count:
            children.reduce((sum, child) => sum + child.count, 0) ||
            countIn(line.slug),
          categories: children,
          // Only when the line holds stock itself, which is the case for a
          // line nothing hangs under.
          branches: children.length === 0 ? branchesFor(line.slug) : [],
        }
      })
      .filter((group) => group.categories.length > 0 || group.branches.length > 0)
  }, [categories, catalogues, products, pick, copy.otherCatalogue])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const selectCatalogue = (categorySlug: string, value: string) => {
    // Clicking the row you are already on clears it, which is the only way
    // back to the whole category without going via the tabs.
    const same = category === categorySlug && catalogue === value
    onCategoryChange(same ? '' : categorySlug)
    onCatalogueChange(same ? '' : value)
  }

  const selectCategory = (slug: string) => {
    const same = category === slug && !catalogue
    onCategoryChange(same ? '' : slug)
    // The old catalogue almost certainly belongs to the category being left.
    onCatalogueChange('')
  }

  if (groups.length === 0) return null

  return (
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
              <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground uppercase">
                {group.label}
              </span>
              <Count n={group.count} />
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                  collapsed[group.slug] && '-rotate-90',
                )}
              />
            </button>

            {!collapsed[group.slug] && (
              <>
                {/* A line with nothing under it: its catalogues sit directly
                    below, exactly as they did before lines existed. */}
                {group.branches.length > 0 && (
                  <BranchList
                    branches={group.branches}
                    categorySlug={group.slug}
                    category={category}
                    catalogue={catalogue}
                    onSelect={selectCatalogue}
                    indent="pl-6"
                  />
                )}

                {group.categories.map((node) => (
                  <div key={node.slug}>
                    <button
                      type="button"
                      aria-pressed={category === node.slug && !catalogue}
                      onClick={() => selectCategory(node.slug)}
                      className={cn(
                        'flex w-full items-center gap-2 py-1.5 pr-4 pl-6 text-left text-sm transition-colors',
                        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                        category === node.slug && !catalogue
                          ? 'font-semibold text-primary'
                          : 'font-medium text-foreground hover:text-primary',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {node.label}
                      </span>
                      <Count n={node.count} />
                    </button>

                    {node.branches.length > 0 && (
                      <BranchList
                        branches={node.branches}
                        categorySlug={node.slug}
                        category={category}
                        catalogue={catalogue}
                        onSelect={selectCatalogue}
                        indent="pl-10"
                      />
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BranchList({
  branches,
  categorySlug,
  category,
  catalogue,
  onSelect,
  indent,
}: {
  branches: Branch[]
  categorySlug: string
  category: string
  catalogue: string
  onSelect: (categorySlug: string, value: string) => void
  indent: string
}) {
  return (
    <ul className="pb-2">
      {branches.map((branch) => {
        const active = category === categorySlug && catalogue === branch.value

        return (
          <li key={`${categorySlug}-${branch.value}`}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(categorySlug, branch.value)}
              className={cn(
                'flex w-full items-center gap-2 py-1.5 pr-4 text-left text-sm transition-colors',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                indent,
                active
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-primary',
              )}
            >
              <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{branch.label}</span>
              <Count n={branch.count} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
