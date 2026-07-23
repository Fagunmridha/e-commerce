import 'dotenv/config'
import './ipv4'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { neon } from '@neondatabase/serverless'

/**
 * Applies the generated SQL migrations over Neon's HTTP driver — the same
 * transport the app uses. This avoids drizzle-kit's WebSocket/session path,
 * which hangs on some networks. Safe to re-run: "already exists" is ignored.
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

  for (const file of files) {
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
        if (/already exists/i.test(message)) continue
        throw error
      }
    }
  }

  console.log('Migrations applied ✓')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
