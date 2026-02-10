import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Migrator, FileMigrationProvider } from 'kysely'
import db from '../config/database.js'

const currentDirname = path.dirname(fileURLToPath(import.meta.url))

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(currentDirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration executed: ${it.migrationName}`)
    } else if (it.status === 'Error') {
      console.error(`❌ Migration failed: ${it.migrationName}`)
    }
  })

  if (error) {
    console.error('❌ Failed to migrate', error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest()
