import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('suppliers')
    .addColumn('ai_analysis_status', 'varchar(20)', (col) => col.notNull().defaultTo('pending'))
    .execute()

  await db.schema
    .createIndex('idx_suppliers_ai_analysis_status')
    .on('suppliers')
    .column('ai_analysis_status')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_suppliers_ai_analysis_status').execute()
  await db.schema.alterTable('suppliers').dropColumn('ai_analysis_status').execute()
}
