import './ipv4'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — add your Neon connection string to .env')
}

const sql = neon(process.env.DATABASE_URL)

export const db = drizzle(sql, { schema })

export * from './schema'
