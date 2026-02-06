
import { Database } from './types.js'
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import env from '#start/env'

const dialect = new PostgresDialect({
  pool: new Pool({
    database: env.get('DB_DATABASE'),
    host: env.get('DB_HOST'),
    user: env.get('DB_USER'),
    password: env.get('DB_PASSWORD'),
    port: env.get('DB_PORT'),
    max: 10,
  })
})

export const db = new Kysely<Database>({
  dialect,
})