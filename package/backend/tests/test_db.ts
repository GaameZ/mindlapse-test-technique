import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from '#database/types'
import env from '#start/env'

if (env.get('NODE_ENV') !== 'test') {
  throw new Error(
    'CRITICAL: test_db.ts should only be imported in test environment. ' +
      `Current NODE_ENV: ${env.get('NODE_ENV')}`
  )
}

const dbName = env.get('DB_DATABASE')
if (!dbName.includes('test')) {
  throw new Error(`CRITICAL: Test database name must contain 'test'. Current: ${dbName}`)
}

const testDb = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: env.get('DB_HOST'),
      port: env.get('DB_PORT'),
      user: env.get('DB_USER'),
      password: env.get('DB_PASSWORD'),
      database: dbName,
      max: 5,
    }),
  }),
})

export default testDb
