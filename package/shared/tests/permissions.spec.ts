import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission, canAccessResource, Role, Permission } from '../src/index.js'

describe('Permissions - hasPermission()', () => {
  test('Owner has all permissions', () => {
    const allPermissions: Permission[] = [
      'supplier:create',
      'supplier:read',
      'supplier:update',
      'supplier:delete',
      'supplier:update_risk',
      'supplier:add_notes',
      'audit:read',
      'user:manage',
      'org:delete',
      'risk_policy:configure',
    ]

    allPermissions.forEach((permission) => {
      assert.equal(
        hasPermission(Role.OWNER, permission),
        true,
        `Owner should have permission: ${permission}`
      )
    })
  })

  test('Admin cannot manage users', () => {
    assert.equal(hasPermission(Role.ADMIN, 'user:manage'), false)
    assert.equal(hasPermission(Role.ADMIN, 'org:delete'), false)
  })

  test('Admin has full CRUD on suppliers', () => {
    assert.equal(hasPermission(Role.ADMIN, 'supplier:create'), true)
    assert.equal(hasPermission(Role.ADMIN, 'supplier:read'), true)
    assert.equal(hasPermission(Role.ADMIN, 'supplier:update'), true)
    assert.equal(hasPermission(Role.ADMIN, 'supplier:delete'), true)

    assert.equal(hasPermission(Role.ADMIN, 'audit:read'), true)
  })

  test('Analyst can only read and update suppliers', () => {
    assert.equal(hasPermission(Role.ANALYST, 'supplier:read'), true)
    assert.equal(hasPermission(Role.ANALYST, 'supplier:update_risk'), true)
    assert.equal(hasPermission(Role.ANALYST, 'supplier:add_notes'), true)

    assert.equal(hasPermission(Role.ANALYST, 'supplier:create'), false)
    assert.equal(hasPermission(Role.ANALYST, 'supplier:delete'), false)
    assert.equal(hasPermission(Role.ANALYST, 'supplier:update'), false)

    assert.equal(hasPermission(Role.ANALYST, 'user:manage'), false)

    assert.equal(hasPermission(Role.ANALYST, 'audit:read'), false)
  })

  test('Auditor is read-only everywhere', () => {
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:read'), true)
    assert.equal(hasPermission(Role.AUDITOR, 'audit:read'), true)

    assert.equal(hasPermission(Role.AUDITOR, 'supplier:create'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:update'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:delete'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:update_risk'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:add_notes'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'user:manage'), false)
    assert.equal(hasPermission(Role.AUDITOR, 'org:delete'), false)
  })

  test('Unknown role has no permissions', () => {
    const unknownRole = 'foo' as Role

    assert.equal(hasPermission(unknownRole, 'supplier:read'), false)
    assert.equal(hasPermission(unknownRole, 'supplier:create'), false)
    assert.equal(hasPermission(unknownRole, 'user:manage'), false)
    assert.equal(hasPermission(unknownRole, 'audit:read'), false)
  })

  test('hasPermission rejects malformed permissions', () => {
    const maliciousPermission = "supplier:read' OR '1'='1" as Permission

    assert.equal(hasPermission(Role.ANALYST, maliciousPermission), false)
  })

  test('Permission check is deterministic', () => {
    const role = Role.ADMIN
    const permission: Permission = 'supplier:create'

    const result1 = hasPermission(role, permission)
    const result2 = hasPermission(role, permission)
    const result3 = hasPermission(role, permission)

    assert.equal(result1, result2)
    assert.equal(result2, result3)
    assert.equal(result1, true)
  })
})

describe('Permissions - canAccessResource()', () => {
  test('User can access resources from their organization', () => {
    const userOrgId = 'org-123'
    const resourceOrgId = 'org-123'

    assert.equal(canAccessResource(userOrgId, resourceOrgId), true)
  })

  test('User CANNOT access resources from other organizations', () => {
    const userOrgId = 'org-123'
    const differentOrgId = 'org-456'

    assert.equal(canAccessResource(userOrgId, differentOrgId), false)
  })

  test('Null organization IDs deny access', () => {
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource(null, 'org-123'), false)
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource('org-123', null), false)
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource(null, null), false)
  })

  test('Undefined organization IDs deny access', () => {
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource(undefined, 'org-123'), false)
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource('org-123', undefined), false)
    // @ts-expect-error - Testing runtime protection
    assert.equal(canAccessResource(undefined, undefined), false)
  })

  test('Empty string organization IDs deny access', () => {
    assert.equal(canAccessResource('', 'org-123'), false)
    assert.equal(canAccessResource('org-123', ''), false)

    assert.equal(canAccessResource('', ''), false)
  })

  test('Case-sensitive comparison prevents bypass', () => {
    const userOrgId = 'org-ABC'
    const resourceOrgIdLower = 'org-abc'

    assert.equal(canAccessResource(userOrgId, resourceOrgIdLower), false)
  })

  test('Whitespace in IDs is not trimmed', () => {
    const userOrgId = ' org-123 '
    const resourceOrgId = 'org-123'

    assert.equal(canAccessResource(userOrgId, resourceOrgId), false)
  })

  test('SQL injection attempts are rejected', () => {
    const userOrgId = 'org-123'
    const maliciousResourceId = "org-456' OR '1'='1"

    assert.equal(canAccessResource(userOrgId, maliciousResourceId), false)
  })

  test('Resource access check is deterministic', () => {
    const userOrgId = 'org-123'
    const resourceOrgId = 'org-456'

    const result1 = canAccessResource(userOrgId, resourceOrgId)
    const result2 = canAccessResource(userOrgId, resourceOrgId)
    const result3 = canAccessResource(userOrgId, resourceOrgId)

    assert.equal(result1, result2)
    assert.equal(result2, result3)
    assert.equal(result1, false)
  })

  test('Same organization with different UUID formats', () => {
    const userOrgId = '123e4567-e89b-12d3-a456-426614174000'
    const resourceOrgIdUpper = '123E4567-E89B-12D3-A456-426614174000'

    assert.equal(canAccessResource(userOrgId, resourceOrgIdUpper), false)
  })
})

describe('Permissions - Integration with RBAC', () => {
  test('Owner + same org = full access', () => {
    const userOrgId = 'org-A'
    const resourceOrgId = 'org-A'

    assert.equal(canAccessResource(userOrgId, resourceOrgId), true)
    assert.equal(hasPermission(Role.OWNER, 'supplier:delete'), true)
    assert.equal(hasPermission(Role.OWNER, 'user:manage'), true)
  })

  test('Owner + different org = no access', () => {
    const userOrgId = 'org-A'
    const resourceOrgId = 'org-B'

    assert.equal(canAccessResource(userOrgId, resourceOrgId), false)
  })

  test('Auditor + same org = read-only access', () => {
    const userOrgId = 'org-A'
    const resourceOrgId = 'org-A'

    assert.equal(canAccessResource(userOrgId, resourceOrgId), true)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:read'), true)
    assert.equal(hasPermission(Role.AUDITOR, 'supplier:update_risk'), false)
  })
})
