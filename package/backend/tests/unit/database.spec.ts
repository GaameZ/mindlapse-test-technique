import { test } from '@japa/runner'
import { sql } from 'kysely'
import { Role, SupplierCategory, RiskLevel, SupplierStatus, AuditAction } from '@mindlapse/shared'
import testDb from '../test_db.js'

test.group('Organizations', (group) => {
  group.each.teardown(async () => {
    await sql`TRUNCATE TABLE organizations CASCADE`.execute(testDb)
  })

  test('should create an organization', async ({ assert }) => {
    const result = await testDb
      .insertInto('organizations')
      .values({ name: 'Acme Corp' })
      .returningAll()
      .executeTakeFirstOrThrow()

    assert.isString(result.id)
    assert.equal(result.name, 'Acme Corp')
    assert.instanceOf(result.created_at, Date)
  })

  test('should find an organization by id', async ({ assert }) => {
    const created = await testDb
      .insertInto('organizations')
      .values({ name: 'Test Org' })
      .returningAll()
      .executeTakeFirstOrThrow()

    const found = await testDb
      .selectFrom('organizations')
      .selectAll()
      .where('id', '=', created.id)
      .executeTakeFirst()

    assert.isNotNull(found)
    assert.equal(found!.name, 'Test Org')
  })

  test('should list all organizations', async ({ assert }) => {
    await testDb
      .insertInto('organizations')
      .values([{ name: 'Org A' }, { name: 'Org B' }])
      .execute()

    const orgs = await testDb.selectFrom('organizations').selectAll().execute()

    assert.lengthOf(orgs, 2)
  })

  test('should delete an organization', async ({ assert }) => {
    const created = await testDb
      .insertInto('organizations')
      .values({ name: 'To Delete' })
      .returningAll()
      .executeTakeFirstOrThrow()

    await testDb.deleteFrom('organizations').where('id', '=', created.id).execute()

    const found = await testDb
      .selectFrom('organizations')
      .selectAll()
      .where('id', '=', created.id)
      .executeTakeFirst()

    assert.isUndefined(found)
  })
})

test.group('Users', (group) => {
  let orgId: string

  group.setup(async () => {
    const org = await testDb
      .insertInto('organizations')
      .values({ name: 'Test Org' })
      .returningAll()
      .executeTakeFirstOrThrow()
    orgId = org.id
  })

  group.teardown(async () => {
    await sql`TRUNCATE TABLE organizations CASCADE`.execute(testDb)
  })

  group.each.teardown(async () => {
    await sql`TRUNCATE TABLE users CASCADE`.execute(testDb)
  })

  test('should create a user linked to an organization', async ({ assert }) => {
    const user = await testDb
      .insertInto('users')
      .values({
        email: 'alice@acme.com',
        password_hash: '$2b$10$fakehashfortest',
        full_name: 'Alice Martin',
        role: Role.ANALYST,
        organization_id: orgId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    assert.isString(user.id)
    assert.equal(user.email, 'alice@acme.com')
    assert.equal(user.role, Role.ANALYST)
    assert.equal(user.organization_id, orgId)
    assert.instanceOf(user.created_at, Date)
  })

  test('should enforce unique email', async ({ assert }) => {
    await testDb
      .insertInto('users')
      .values({
        email: 'duplicate@acme.com',
        password_hash: '$2b$10$fakehash1',
        full_name: 'User One',
        role: Role.ADMIN,
        organization_id: orgId,
      })
      .execute()

    try {
      await testDb
        .insertInto('users')
        .values({
          email: 'duplicate@acme.com',
          password_hash: '$2b$10$fakehash2',
          full_name: 'User Two',
          role: Role.ANALYST,
          organization_id: orgId,
        })
        .execute()
      assert.fail('Should have thrown a unique constraint error')
    } catch (error: unknown) {
      assert.instanceOf(error, Error)
    }
  })

  test('should find users by organization', async ({ assert }) => {
    await testDb
      .insertInto('users')
      .values([
        {
          email: 'user1@acme.com',
          password_hash: '$2b$10$hash1',
          full_name: 'User 1',
          role: Role.ANALYST,
          organization_id: orgId,
        },
        {
          email: 'user2@acme.com',
          password_hash: '$2b$10$hash2',
          full_name: 'User 2',
          role: Role.AUDITOR,
          organization_id: orgId,
        },
      ])
      .execute()

    const users = await testDb
      .selectFrom('users')
      .selectAll()
      .where('organization_id', '=', orgId)
      .execute()

    assert.lengthOf(users, 2)
  })

  test('should cascade delete users when organization is deleted', async ({ assert }) => {
    await testDb
      .insertInto('users')
      .values({
        email: 'cascade@acme.com',
        password_hash: '$2b$10$cascadehash',
        full_name: 'Cascade User',
        role: Role.OWNER,
        organization_id: orgId,
      })
      .execute()

    await testDb.deleteFrom('organizations').where('id', '=', orgId).execute()

    const users = await testDb
      .selectFrom('users')
      .selectAll()
      .where('organization_id', '=', orgId)
      .execute()

    assert.lengthOf(users, 0)
  })
})

test.group('Suppliers', (group) => {
  let orgId: string

  group.setup(async () => {
    const org = await testDb
      .insertInto('organizations')
      .values({ name: 'Supplier Org' })
      .returningAll()
      .executeTakeFirstOrThrow()
    orgId = org.id
  })

  group.teardown(async () => {
    await sql`TRUNCATE TABLE organizations CASCADE`.execute(testDb)
  })

  group.each.teardown(async () => {
    await sql`TRUNCATE TABLE suppliers CASCADE`.execute(testDb)
  })

  test('should create a supplier', async ({ assert }) => {
    const supplier = await testDb
      .insertInto('suppliers')
      .values({
        name: 'CloudGuard',
        domain: 'cloudguard.io',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        organization_id: orgId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    assert.isString(supplier.id)
    assert.equal(supplier.name, 'CloudGuard')
    assert.equal(supplier.domain, 'cloudguard.io')
    assert.equal(supplier.category, SupplierCategory.SAAS)
    assert.equal(supplier.risk_level, RiskLevel.MEDIUM)
    assert.equal(supplier.status, SupplierStatus.ACTIVE)
    assert.isNull(supplier.ai_risk_score)
    assert.isNull(supplier.ai_analysis)
  })

  test('should update a supplier risk level', async ({ assert }) => {
    const supplier = await testDb
      .insertInto('suppliers')
      .values({
        name: 'InfraNet',
        domain: 'infranet.com',
        category: SupplierCategory.INFRASTRUCTURE,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        organization_id: orgId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await testDb
      .updateTable('suppliers')
      .set({ risk_level: RiskLevel.CRITICAL })
      .where('id', '=', supplier.id)
      .execute()

    const updated = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', supplier.id)
      .executeTakeFirstOrThrow()

    assert.equal(updated.risk_level, RiskLevel.CRITICAL)
  })

  test('should store AI analysis as JSON', async ({ assert }) => {
    const aiAnalysis = {
      score: 72.5,
      vulnerabilities: ['outdated_ssl', 'no_mfa'],
      recommendation: 'Upgrade TLS and enable MFA',
    }

    const supplier = await testDb
      .insertInto('suppliers')
      .values({
        name: 'AI Tested',
        domain: 'aitested.io',
        category: SupplierCategory.CONSULTING,
        risk_level: RiskLevel.HIGH,
        status: SupplierStatus.UNDER_REVIEW,
        organization_id: orgId,
        ai_risk_score: 72.5,
        ai_analysis: JSON.stringify(aiAnalysis),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    assert.equal(supplier.ai_risk_score, 72.5)
    const analysis = supplier.ai_analysis as Record<string, unknown>
    assert.equal(analysis.score, 72.5)
    assert.deepEqual(analysis.vulnerabilities, ['outdated_ssl', 'no_mfa'])
  })

  test('should filter suppliers by risk level within an organization', async ({ assert }) => {
    await testDb
      .insertInto('suppliers')
      .values([
        {
          name: 'Low Risk',
          domain: 'lowrisk.com',
          category: SupplierCategory.OTHER,
          risk_level: RiskLevel.LOW,
          status: SupplierStatus.ACTIVE,
          organization_id: orgId,
        },
        {
          name: 'Critical Risk',
          domain: 'criticalrisk.com',
          category: SupplierCategory.SAAS,
          risk_level: RiskLevel.CRITICAL,
          status: SupplierStatus.ACTIVE,
          organization_id: orgId,
        },
      ])
      .execute()

    const critical = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('organization_id', '=', orgId)
      .where('risk_level', '=', RiskLevel.CRITICAL)
      .execute()

    assert.lengthOf(critical, 1)
    assert.equal(critical[0].name, 'Critical Risk')
  })

  test('should cascade delete suppliers when organization is deleted', async ({ assert }) => {
    await testDb
      .insertInto('suppliers')
      .values({
        name: 'Cascade Supplier',
        domain: 'cascade.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        organization_id: orgId,
      })
      .execute()

    await testDb.deleteFrom('organizations').where('id', '=', orgId).execute()

    const suppliers = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('organization_id', '=', orgId)
      .execute()

    assert.lengthOf(suppliers, 0)
  })
})

test.group('Audit Logs', (group) => {
  let orgId: string
  let userId: string
  let supplierId: string

  group.setup(async () => {
    const org = await testDb
      .insertInto('organizations')
      .values({ name: 'Audit Org' })
      .returningAll()
      .executeTakeFirstOrThrow()
    orgId = org.id

    const user = await testDb
      .insertInto('users')
      .values({
        email: 'auditor@acme.com',
        password_hash: '$2b$10$audithash',
        full_name: 'Audit User',
        role: Role.ADMIN,
        organization_id: orgId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    userId = user.id

    const supplier = await testDb
      .insertInto('suppliers')
      .values({
        name: 'Audited Supplier',
        domain: 'audited.io',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        organization_id: orgId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    supplierId = supplier.id
  })

  group.teardown(async () => {
    await sql`TRUNCATE TABLE organizations CASCADE`.execute(testDb)
  })

  group.each.teardown(async () => {
    await sql`TRUNCATE TABLE audit_logs CASCADE`.execute(testDb)
  })

  test('should create an audit log entry on supplier creation', async ({ assert }) => {
    const log = await testDb
      .insertInto('audit_logs')
      .values({
        user_id: userId,
        action: AuditAction.CREATE,
        entity_type: 'supplier',
        entity_id: supplierId,
        before: null,
        after: JSON.stringify({ name: 'Audited Supplier', risk_level: 'medium' }),
        ip_address: '192.168.1.1',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    assert.isString(log.id)
    assert.equal(log.action, AuditAction.CREATE)
    assert.equal(log.entity_type, 'supplier')
    assert.equal(log.entity_id, supplierId)
    assert.isNull(log.before)
    assert.isNotNull(log.after)
    assert.instanceOf(log.created_at, Date)
  })

  test('should record before/after state on update', async ({ assert }) => {
    const beforeState = { risk_level: 'medium' }
    const afterState = { risk_level: 'critical' }

    const log = await testDb
      .insertInto('audit_logs')
      .values({
        user_id: userId,
        action: AuditAction.UPDATE,
        entity_type: 'supplier',
        entity_id: supplierId,
        before: JSON.stringify(beforeState),
        after: JSON.stringify(afterState),
        ip_address: '10.0.0.1',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    const before = log.before as Record<string, unknown>
    const after = log.after as Record<string, unknown>
    assert.equal(before.risk_level, 'medium')
    assert.equal(after.risk_level, 'critical')
  })

  test('should list audit logs in chronological order', async ({ assert }) => {
    await testDb
      .insertInto('audit_logs')
      .values([
        {
          user_id: userId,
          action: AuditAction.CREATE,
          entity_type: 'supplier',
          entity_id: supplierId,
          before: null,
          after: JSON.stringify({ name: 'Supplier' }),
          ip_address: '10.0.0.1',
        },
        {
          user_id: userId,
          action: AuditAction.UPDATE,
          entity_type: 'supplier',
          entity_id: supplierId,
          before: JSON.stringify({ risk_level: 'low' }),
          after: JSON.stringify({ risk_level: 'high' }),
          ip_address: '10.0.0.1',
        },
        {
          user_id: userId,
          action: AuditAction.DELETE,
          entity_type: 'supplier',
          entity_id: supplierId,
          before: JSON.stringify({ name: 'Supplier' }),
          after: null,
          ip_address: '10.0.0.1',
        },
      ])
      .execute()

    const logs = await testDb
      .selectFrom('audit_logs')
      .selectAll()
      .where('entity_id', '=', supplierId)
      .orderBy('created_at', 'asc')
      .execute()

    assert.lengthOf(logs, 3)
    assert.equal(logs[0].action, AuditAction.CREATE)
    assert.equal(logs[1].action, AuditAction.UPDATE)
    assert.equal(logs[2].action, AuditAction.DELETE)
  })

  test('should enforce foreign key on user_id', async ({ assert }) => {
    try {
      await testDb
        .insertInto('audit_logs')
        .values({
          user_id: '00000000-0000-0000-0000-000000000000',
          action: AuditAction.CREATE,
          entity_type: 'supplier',
          entity_id: supplierId,
          before: null,
          after: null,
          ip_address: '10.0.0.1',
        })
        .execute()
      assert.fail('Should have thrown a foreign key constraint error')
    } catch (error: unknown) {
      assert.instanceOf(error, Error)
    }
  })
})

test.group('Multi-tenant isolation', (group) => {
  let orgAId: string
  let orgBId: string

  group.setup(async () => {
    const orgA = await testDb
      .insertInto('organizations')
      .values({ name: 'Organization A' })
      .returningAll()
      .executeTakeFirstOrThrow()
    orgAId = orgA.id

    const orgB = await testDb
      .insertInto('organizations')
      .values({ name: 'Organization B' })
      .returningAll()
      .executeTakeFirstOrThrow()
    orgBId = orgB.id

    await testDb
      .insertInto('suppliers')
      .values([
        {
          name: 'Supplier Org A',
          domain: 'orga.com',
          category: SupplierCategory.SAAS,
          risk_level: RiskLevel.LOW,
          status: SupplierStatus.ACTIVE,
          organization_id: orgAId,
        },
        {
          name: 'Supplier Org B',
          domain: 'orgb.com',
          category: SupplierCategory.INFRASTRUCTURE,
          risk_level: RiskLevel.HIGH,
          status: SupplierStatus.ACTIVE,
          organization_id: orgBId,
        },
      ])
      .execute()
  })

  group.teardown(async () => {
    await sql`TRUNCATE TABLE organizations CASCADE`.execute(testDb)
  })

  test('org A should only see its own suppliers', async ({ assert }) => {
    const suppliers = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('organization_id', '=', orgAId)
      .execute()

    assert.lengthOf(suppliers, 1)
    assert.equal(suppliers[0].name, 'Supplier Org A')
  })

  test('org B should only see its own suppliers', async ({ assert }) => {
    const suppliers = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('organization_id', '=', orgBId)
      .execute()

    assert.lengthOf(suppliers, 1)
    assert.equal(suppliers[0].name, 'Supplier Org B')
  })

  test('scoped query should never return data from another org', async ({ assert }) => {
    const suppliersA = await testDb
      .selectFrom('suppliers')
      .selectAll()
      .where('organization_id', '=', orgAId)
      .execute()

    for (const supplier of suppliersA) {
      assert.equal(supplier.organization_id, orgAId)
      assert.notEqual(supplier.organization_id, orgBId)
    }
  })
})
