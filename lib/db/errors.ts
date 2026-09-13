/**
 * Reading a constraint violation back off a driver error.
 *
 * Drizzle wraps the driver's error in a `DrizzleQueryError` and Neon wraps the
 * server's in a `NeonDbError`, so neither `code` nor `constraint` is reliably on
 * the object that reaches a `catch`. Walking the `cause` chain finds it wherever
 * it ended up, and the message is checked as a fallback because a wrapper that
 * only re-threw the text still carries the index name in it.
 *
 * Used to turn "duplicate key value violates unique constraint
 * categories_parent_name_idx" — true, and useless to the person typing — into a
 * sentence naming the field to change.
 */

/** Postgres: unique_violation. */
const UNIQUE_VIOLATION = '23505'

type PgErrorish = { code?: unknown; constraint?: unknown; cause?: unknown }

/** Every error in the `cause` chain, innermost last. Cycle-safe. */
function chain(error: unknown): PgErrorish[] {
  const found: PgErrorish[] = []
  const seen = new Set<unknown>()
  let current = error

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    found.push(current as PgErrorish)
    current = (current as PgErrorish).cause
  }

  return found
}

/**
 * True when `error` is a unique-constraint violation, optionally of one named
 * index. Without a name it matches any of them.
 */
export function isUniqueViolation(error: unknown, index?: string): boolean {
  const links = chain(error)

  const isUnique =
    links.some((link) => link.code === UNIQUE_VIOLATION) ||
    /duplicate key value violates unique constraint/i.test(
      error instanceof Error ? error.message : '',
    )

  if (!isUnique) return false
  if (!index) return true

  return (
    links.some((link) => link.constraint === index) ||
    (error instanceof Error && error.message.includes(index))
  )
}
