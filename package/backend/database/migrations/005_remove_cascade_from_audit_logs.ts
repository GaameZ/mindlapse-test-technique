import { Kysely } from 'kysely'

/**
 * Migration pour retirer le CASCADE DELETE sur audit_logs.user_id
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('audit_logs').dropConstraint('fk_audit_logs_user_id').execute()

  await db.schema
    .alterTable('audit_logs')
    .addForeignKeyConstraint('fk_audit_logs_user_id', ['user_id'], 'users', ['id'])
    .onDelete('restrict')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('audit_logs').dropConstraint('fk_audit_logs_user_id').execute()

  await db.schema
    .alterTable('audit_logs')
    .addForeignKeyConstraint('fk_audit_logs_user_id', ['user_id'], 'users', ['id'])
    .onDelete('cascade')
    .execute()
}
