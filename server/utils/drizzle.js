import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '~/db/schema'

let _db = null

export function useDB() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL || 'postgres://mbx@127.0.0.1:5432/psy_engine'
    const client = postgres(connectionString)
    _db = drizzle(client, { schema })
  }
  return _db
}
