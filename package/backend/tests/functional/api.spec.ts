import { test } from '@japa/runner'
import db from '#config/database'
import AuthService from '#services/auth_service'
import { 
  Role, 
  SupplierCategory, 
  RiskLevel, 
  SupplierStatus,
  type AuditLog
} from '@mindlapse/shared'

/*
|--------------------------------------------------------------------------
| Helper: create test organization + user + get token
|--------------------------------------------------------------------------
*/
async function createTestOrg(name: string): Promise<string> {
  const org = await db
    .insertInto('organizations')
    .values({ name })
    .returning('id')
    .executeTakeFirstOrThrow()
  return org.id
}

async function createTestUser(
  orgId: string,
  email: string,
  role: Role = Role.OWNER,
  password: string = 'Password123!'
): Promise<{ userId: string; token: string }> {
  const hash = await AuthService.hashPassword(password)
  const user = await db
    .insertInto('users')
    .values({
      email,
      password_hash: hash,
      full_name: `Test ${role}`,
      role,
      organization_id: orgId,
    })
    .returning('id')
    .executeTakeFirstOrThrow()

  const tokens = AuthService.generateTokens({
    userId: user.id,
    email,
    role,
    organizationId: orgId,
  })
  return { userId: user.id, token: tokens.accessToken }
}

async function cleanupAll(): Promise<void> {
  await db.deleteFrom('audit_logs').execute()
  await db.deleteFrom('suppliers').execute()
  await db.deleteFrom('users').execute()
  await db.deleteFrom('organizations').execute()
}

/*
|--------------------------------------------------------------------------
| Auth API Tests
|--------------------------------------------------------------------------
*/
test.group('Auth API', (group) => {
  group.teardown(async () => {
    await cleanupAll()
  })

  test('POST /api/v1/auth/register — creates org + user', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        email: 'owner@testauth.com',
        password: 'Password123!',
        fullName: 'Auth Owner',
        organizationName: 'Auth Test Org',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      data: {
        user: {
          email: 'owner@testauth.com',
          role: 'owner',
        },
      },
    })

    const body = response.body()
    assert.isDefined(body.data.tokens.accessToken)
    assert.isDefined(body.data.tokens.refreshToken)
  })

  test('POST /api/v1/auth/register — rejects duplicate email', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        email: 'owner@testauth.com',
        password: 'Password123!',
        fullName: 'Auth Owner 2',
        organizationName: 'Auth Test Org 2',
      })

    response.assertStatus(409)
  })

  test('POST /api/v1/auth/login — valid credentials', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/login')
      .json({
        email: 'owner@testauth.com',
        password: 'Password123!',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      data: { user: { email: 'owner@testauth.com' } },
    })
  })

  test('POST /api/v1/auth/login — invalid password', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/login')
      .json({
        email: 'owner@testauth.com',
        password: 'WrongPassword!',
      })

    response.assertStatus(401)
  })

  test('POST /api/v1/auth/refresh — refreshes tokens', async ({ client, assert }) => {
    const loginRes = await client
      .post('/api/v1/auth/login')
      .json({ email: 'owner@testauth.com', password: 'Password123!' })

    const refreshToken = loginRes.body().data.tokens.refreshToken

    const response = await client
      .post('/api/v1/auth/refresh')
      .json({ refreshToken })

    response.assertStatus(200)
    const body = response.body()
    assert.isDefined(body.data.tokens.accessToken)
    assert.isDefined(body.data.tokens.refreshToken)
  })

  test('GET /api/v1/auth/me — returns authenticated user', async ({ client }) => {
    const loginRes = await client
      .post('/api/v1/auth/login')
      .json({ email: 'owner@testauth.com', password: 'Password123!' })

    const token = loginRes.body().data.tokens.accessToken

    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      data: { user: { email: 'owner@testauth.com' } },
    })
  })

  test('GET /api/v1/auth/me — rejects without token', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')
    response.assertStatus(401)
  })
})

/*
|--------------------------------------------------------------------------
| Suppliers API Tests
|--------------------------------------------------------------------------
*/
test.group('Suppliers API', (group) => {
  let orgId: string
  let ownerToken: string
  let analystToken: string
  let auditorToken: string
  let supplierId: string

  group.setup(async () => {
    orgId = await createTestOrg('Supplier Test Org')
    const owner = await createTestUser(orgId, 'supplier-owner@test.com', Role.OWNER)
    const analyst = await createTestUser(orgId, 'supplier-analyst@test.com', Role.ANALYST)
    const auditor = await createTestUser(orgId, 'supplier-auditor@test.com', Role.AUDITOR)
    ownerToken = owner.token
    analystToken = analyst.token
    auditorToken = auditor.token
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('POST /api/v1/suppliers — owner can create', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'Acme Security',
        domain: 'acme-security.com',
        category: 'saas',
        riskLevel: 'high',
        status: 'active',
        notes: 'Initial assessment needed',
      })

    response.assertStatus(201)
    const body = response.body()
    assert.isDefined(body.data.id)
    assert.equal(body.data.name, 'Acme Security')
    assert.equal(body.data.riskLevel, 'high')
    supplierId = body.data.id
  })

  test('POST /api/v1/suppliers — analyst cannot create (RBAC)', async ({ client }) => {
    const response = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${analystToken}`)
      .json({
        name: 'Bad Corp',
        domain: 'bad.com',
        category: 'other',
        riskLevel: 'low',
        status: 'active',
      })

    response.assertStatus(403)
  })

  test('GET /api/v1/suppliers — returns paginated list', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .qs({ page: 1, limit: 10 })

    response.assertStatus(200)
    const body = response.body()
    assert.lengthOf(body.data, 1)
    assert.equal(body.meta.total, 1)
    assert.equal(body.meta.page, 1)
    assert.equal(body.meta.perPage, 10)
  })

  test('GET /api/v1/suppliers — analyst can read', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${analystToken}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)
  })

  test('GET /api/v1/suppliers — supports search filter', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .qs({ search: 'acme' })

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 1)

    const noResultResponse = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .qs({ search: 'nonexistent' })

    assert.lengthOf(noResultResponse.body().data, 0)
  })

  test('GET /api/v1/suppliers/:id — returns single supplier', async ({ client, assert }) => {
    const response = await client
      .get(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    response.assertStatus(200)
    assert.equal(response.body().data.id, supplierId)
  })

  test('PUT /api/v1/suppliers/:id — owner can update', async ({ client, assert }) => {
    const response = await client
      .put(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({ riskLevel: 'critical', notes: 'Elevated risk after assessment' })

    response.assertStatus(200)
    assert.equal(response.body().data.riskLevel, 'critical')
    assert.equal(response.body().data.notes, 'Elevated risk after assessment')
  })

  test('PUT /api/v1/suppliers/:id — analyst cannot update (no supplier:update)', async ({
    client,
  }) => {
    const response = await client
      .put(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${analystToken}`)
      .json({ name: 'Hacked Name' })

    response.assertStatus(403)
  })

  test('DELETE /api/v1/suppliers/:id — auditor cannot delete (RBAC)', async ({ client }) => {
    const response = await client
      .delete(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${auditorToken}`)

    response.assertStatus(403)
  })

  test('DELETE /api/v1/suppliers/:id — owner can delete', async ({ client }) => {
    const createRes = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'To Delete Corp',
        domain: 'delete.com',
        category: 'other',
        riskLevel: 'low',
        status: 'inactive',
      })

    const toDeleteId = createRes.body().data.id

    const response = await client
      .delete(`/api/v1/suppliers/${toDeleteId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    response.assertStatus(200)

    const getRes = await client
      .get(`/api/v1/suppliers/${toDeleteId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    getRes.assertStatus(404)
  })
})

/*
|--------------------------------------------------------------------------
| Audit Logs API Tests
|--------------------------------------------------------------------------
*/
test.group('Audit Logs API', (group) => {
  let orgId: string
  let ownerToken: string

  group.setup(async () => {
    orgId = await createTestOrg('Audit Test Org')
    const owner = await createTestUser(orgId, 'audit-owner@test.com', Role.OWNER)
    ownerToken = owner.token
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('GET /api/v1/suppliers/:supplierId/audit-logs — returns audit logs for a specific supplier', async ({ client, assert }) => {
    const createRes = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'Supplier for Audit Test',
        domain: 'supplier-audit.com',
        category: 'saas',
        riskLevel: 'low',
        status: 'active',
      })

    createRes.assertStatus(201)
    const supplierId = createRes.body().data.id

    await client
      .put(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({ riskLevel: 'high' })

    const response = await client
      .get(`/api/v1/suppliers/${supplierId}/audit-logs`)
      .header('Authorization', `Bearer ${ownerToken}`)

    response.assertStatus(200)
    const body = response.body()
    
    assert.isAtLeast(body.data.length, 2)
    assert.isTrue(body.data.every((log: AuditLog) => log.entityId === supplierId))
    assert.isTrue(body.data.every((log: AuditLog) => log.entityType === 'supplier'))
    
    const actions = body.data.map((log: AuditLog) => log.action)
    assert.include(actions, 'CREATE')
    assert.include(actions, 'UPDATE')
  })
})

/*
|--------------------------------------------------------------------------
| Users API Tests
|--------------------------------------------------------------------------
*/
test.group('Users API', (group) => {
  let orgId: string
  let ownerToken: string
  let analystToken: string
  let createdUserId: string

  group.setup(async () => {
    orgId = await createTestOrg('Users Test Org')
    const owner = await createTestUser(orgId, 'user-owner@test.com', Role.OWNER)
    const analyst = await createTestUser(orgId, 'user-analyst@test.com', Role.ANALYST)
    ownerToken = owner.token
    analystToken = analyst.token
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('POST /api/v1/users — owner can create user in org', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/users')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        email: 'newuser@test.com',
        password: 'NewUser123!',
        fullName: 'New User',
        role: 'admin',
      })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.data.email, 'newuser@test.com')
    assert.equal(body.data.role, 'admin')
    createdUserId = body.data.id
  })

  test('POST /api/v1/users — analyst cannot create users (RBAC)', async ({ client }) => {
    const response = await client
      .post('/api/v1/users')
      .header('Authorization', `Bearer ${analystToken}`)
      .json({
        email: 'hacker@test.com',
        password: 'Hacked123!',
        fullName: 'Hacker',
        role: 'owner',
      })

    response.assertStatus(403)
  })

  test('GET /api/v1/users — owner can list users', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/users')
      .header('Authorization', `Bearer ${ownerToken}`)

    response.assertStatus(200)
    const body = response.body()
    assert.isAbove(body.data.length, 1)
    assert.isDefined(body.meta)
  })

  test('PUT /api/v1/users/:id — owner can update user role', async ({ client, assert }) => {
    const response = await client
      .put(`/api/v1/users/${createdUserId}`)
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({ role: 'auditor' })

    response.assertStatus(200)
    assert.equal(response.body().data.role, 'auditor')
  })

  test('DELETE /api/v1/users/:id — owner can delete user', async ({ client }) => {
    const response = await client
      .delete(`/api/v1/users/${createdUserId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    response.assertStatus(200)
  })
})

/*
|--------------------------------------------------------------------------
| Multi-tenant Isolation Tests
|--------------------------------------------------------------------------
*/
test.group('Multi-tenant Isolation', (group) => {
  let orgAId: string
  let orgBId: string
  let orgAToken: string
  let orgBToken: string
  let orgASupplerId: string

  group.setup(async () => {
    orgAId = await createTestOrg('Org A')
    orgBId = await createTestOrg('Org B')

    const userA = await createTestUser(orgAId, 'owner-a@test.com', Role.OWNER)
    const userB = await createTestUser(orgBId, 'owner-b@test.com', Role.OWNER)
    orgAToken = userA.token
    orgBToken = userB.token

    const supplier = await db
      .insertInto('suppliers')
      .values({
        name: 'Org A Supplier',
        domain: 'orga.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        organization_id: orgAId,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    orgASupplerId = supplier.id
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('Org B cannot see Org A suppliers in list', async ({ client, assert }) => {
    const response = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${orgBToken}`)

    response.assertStatus(200)
    assert.lengthOf(response.body().data, 0)
  })

  test('Org B cannot access Org A supplier by ID', async ({ client }) => {
    const response = await client
      .get(`/api/v1/suppliers/${orgASupplerId}`)
      .header('Authorization', `Bearer ${orgBToken}`)

    response.assertStatus(404)
  })

  test('Org B cannot update Org A supplier', async ({ client }) => {
    const response = await client
      .put(`/api/v1/suppliers/${orgASupplerId}`)
      .header('Authorization', `Bearer ${orgBToken}`)
      .json({ name: 'Hacked!' })

    response.assertStatus(404)
  })

  test('Org B cannot delete Org A supplier', async ({ client }) => {
    const response = await client
      .delete(`/api/v1/suppliers/${orgASupplerId}`)
      .header('Authorization', `Bearer ${orgBToken}`)

    response.assertStatus(404)
  })

  test('Org A can see own supplier', async ({ client, assert }) => {
    const response = await client
      .get(`/api/v1/suppliers/${orgASupplerId}`)
      .header('Authorization', `Bearer ${orgAToken}`)

    response.assertStatus(200)
    assert.equal(response.body().data.name, 'Org A Supplier')
  })
})

/*
|--------------------------------------------------------------------------
| Validation Tests
|--------------------------------------------------------------------------
*/
test.group('Input Validation', (group) => {
  let ownerToken: string

  group.setup(async () => {
    const orgId = await createTestOrg('Validation Test Org')
    const owner = await createTestUser(orgId, 'validation-owner@test.com', Role.OWNER)
    ownerToken = owner.token
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('Register rejects invalid email', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        email: 'not-an-email',
        password: 'Password123!',
        fullName: 'Bad Email',
      })

    response.assertStatus(422)
  })

  test('Register rejects short password', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        email: 'shortpw@test.com',
        password: 'short',
        fullName: 'Short PW',
      })

    response.assertStatus(422)
  })

  test('Create supplier rejects invalid risk level', async ({ client }) => {
    const response = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'Bad Supplier',
        domain: 'bad.com',
        category: 'saas',
        riskLevel: 'invalid_level',
        status: 'active',
      })

    response.assertStatus(422)
  })

  test('Create supplier rejects missing required fields', async ({ client }) => {
    const response = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'Incomplete',
      })

    response.assertStatus(422)
  })

  test('List suppliers rejects limit > 100', async ({ client }) => {
    const response = await client
      .get('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .qs({ limit: 200 })

    response.assertStatus(422)
  })
})

/*
|--------------------------------------------------------------------------
| Audit Trail Integrity Tests
|--------------------------------------------------------------------------
*/
test.group('Audit Trail Integrity', (group) => {
  let ownerToken: string

  group.setup(async () => {
    const orgId = await createTestOrg('Audit Integrity Org')
    const owner = await createTestUser(orgId, 'audit-integrity@test.com', Role.OWNER)
    ownerToken = owner.token
  })

  group.teardown(async () => {
    await cleanupAll()
  })

  test('CRUD operations generate audit trail with before/after state', async ({
    client,
    assert,
  }) => {
    const createRes = await client
      .post('/api/v1/suppliers')
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({
        name: 'Audit Trail Corp',
        domain: 'audittrail.com',
        category: 'consulting',
        riskLevel: 'low',
        status: 'active',
      })

    createRes.assertStatus(201)
    const supplierId = createRes.body().data.id

    await client
      .put(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)
      .json({ riskLevel: 'critical' })

    const logsBeforeDelete = await client
      .get(`/api/v1/suppliers/${supplierId}/audit-logs`)
      .header('Authorization', `Bearer ${ownerToken}`)
      .qs({ sortOrder: 'asc' })

    logsBeforeDelete.assertStatus(200)
    const logsBeforeDeleteData = logsBeforeDelete.body().data

    assert.equal(logsBeforeDeleteData.length, 2)
    assert.equal(logsBeforeDeleteData[0].action, 'CREATE')
    assert.equal(logsBeforeDeleteData[1].action, 'UPDATE')

    const createLog = logsBeforeDeleteData[0]
    assert.isNull(createLog.before)
    assert.isDefined(createLog.after)
    assert.equal(createLog.after.name, 'Audit Trail Corp')
    assert.equal(createLog.after.risk_level, 'low')

    const updateLog = logsBeforeDeleteData[1]
    assert.isDefined(updateLog.before)
    assert.isDefined(updateLog.after)
    assert.equal(updateLog.before.risk_level, 'low')
    assert.equal(updateLog.after.risk_level, 'critical')

    const deleteRes = await client
      .delete(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    deleteRes.assertStatus(200)

    const getDeletedSupplier = await client
      .get(`/api/v1/suppliers/${supplierId}`)
      .header('Authorization', `Bearer ${ownerToken}`)

    getDeletedSupplier.assertStatus(404)

    const logsAfterDelete = await client
      .get(`/api/v1/suppliers/${supplierId}/audit-logs`)
      .header('Authorization', `Bearer ${ownerToken}`)

    logsAfterDelete.assertStatus(404)

    const allLogs = await db
      .selectFrom('audit_logs')
      .selectAll()
      .where('entity_id', '=', supplierId)
      .where('entity_type', '=', 'supplier')
      .orderBy('created_at', 'asc')
      .execute()

    assert.equal(allLogs.length, 3)
    assert.equal(allLogs[0].action, 'CREATE')
    assert.equal(allLogs[1].action, 'UPDATE')
    assert.equal(allLogs[2].action, 'DELETE')

    const deleteLog = allLogs[2]
    assert.isDefined(deleteLog.before)
    assert.isNull(deleteLog.after)
    assert.equal(deleteLog.before!.name, 'Audit Trail Corp')
    assert.equal(deleteLog.before!.risk_level, 'critical')
  })
})
