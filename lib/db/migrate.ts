import 'dotenv/config'
import './ipv4'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'

/**
 * Applies the generated SQL migrations over Neon's HTTP driver — the same
 * transport the app uses. This avoids drizzle-kit's WebSocket/session path,
 * which hangs on some networks.
 *
 * Every file that applies cleanly is recorded in `__migrations`, so re-running
 * is a no-op rather than a replay. That matters because not every statement is
 * idempotent: a bare `DROP COLUMN` throws "does not exist" the second time
 * round, which would abort the whole run before reaching newer files.
 *
 * The "already exists" swallow below stays as a one-time bridge for databases
 * that were built with `db:push` (or by an older version of this script)
 * before `__migrations` existed — their first run re-reads 0000, finds
 * everything present, and records it. It is deliberately narrow: any other
 * error still fails the run loudly.
 *
 * Run with: pnpm db:migrate
 */
async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set — fill in your .env first')

  const sql = neon(url)
  const dir = join(process.cwd(), 'lib', 'db', 'migrations')
  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migration files — run `pnpm db:generate` first.')
    return
  }

  await sql.query(`
    CREATE TABLE IF NOT EXISTS __migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const applied = new Set<string>(
    ((await sql.query('SELECT name FROM __migrations')) as { name: string }[]).map(
      (row) => row.name,
    ),
  )

  let count = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} — already applied.`)
      continue
    }

    const contents = readFileSync(join(dir, file), 'utf8')
    const statements = contents
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean)

    console.log(`Applying ${file} (${statements.length} statements)…`)
    for (const statement of statements) {
      try {
        await sql.query(statement)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (/already exists/i.test(message)) {
          console.warn(`  skipped — ${message}`)
          continue
        }
        throw error
      }
    }

    await sql.query(
      'INSERT INTO __migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
      [file],
    )
    count += 1
  }

  console.log(
    count === 0
      ? 'Nothing to apply — database is up to date ✓'
      : `Migrations applied ✓ (${count} file${count === 1 ? '' : 's'})`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
