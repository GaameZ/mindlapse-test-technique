import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('suppliers')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('domain', 'varchar(255)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) =>
      col.notNull().defaultTo('Other')
    )
    .addColumn('risk_level', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('status', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('contract_end_date', 'date')
    .addColumn('notes', 'text')
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('ai_risk_score', 'double precision')
    .addColumn('ai_analysis', 'jsonb')
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      'fk_suppliers_organization_id',
      ['organization_id'],
      'organizations',
      ['id'],
      (constraint) => constraint.onDelete('cascade')
    )
    .execute()

  await db.schema
    .createIndex('idx_suppliers_organization_id')
    .on('suppliers')
    .column('organization_id')
    .execute()

  await db.schema
    .createIndex('idx_suppliers_domain')
    .on('suppliers')
    .column('domain')
    .execute()

  await db.schema
    .createIndex('idx_suppliers_risk_level')
    .on('suppliers')
    .column('risk_level')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('suppliers').execute()
}
