import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull())
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('entity_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('entity_id', 'uuid', (col) => col.notNull())
    .addColumn('before', 'jsonb')
    .addColumn('after', 'jsonb')
    .addColumn('ip_address', 'varchar(45)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      'fk_audit_logs_user_id',
      ['user_id'],
      'users',
      ['id'],
      (constraint) => constraint.onDelete('cascade')
    )
    .execute()

  await db.schema
    .createIndex('idx_audit_logs_user_id')
    .on('audit_logs')
    .column('user_id')
    .execute()

  await db.schema
    .createIndex('idx_audit_logs_entity_id')
    .on('audit_logs')
    .column('entity_id')
    .execute()

  await db.schema
    .createIndex('idx_audit_logs_action')
    .on('audit_logs')
    .column('action')
    .execute()

  await db.schema
    .createIndex('idx_audit_logs_created_at')
    .on('audit_logs')
    .column('created_at')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('audit_logs').execute()
}
