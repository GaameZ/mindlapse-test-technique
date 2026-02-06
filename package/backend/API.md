# API Documentation — Mindlapse Cyber Risk Intelligence Platform

**Base URL:** `http://localhost:3333/api/v1`

All endpoints return JSON. Protected endpoints require an `Authorization: Bearer <token>` header.

---

## Table of Contents

- [Authentication](#authentication)
- [Suppliers](#suppliers)
- [Audit Logs](#audit-logs)
- [Users](#users)
- [Error Responses](#error-responses)
- [Pagination](#pagination)
- [RBAC Permissions](#rbac-permissions)

---

## Authentication

### POST `/api/v1/auth/register`

Create a new user account and organization.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MinLength8Chars",
  "fullName": "John Doe",
  "organizationName": "Acme Corp",
  "organizationId": "uuid (optional — join existing org)"
}
```

- If `organizationId` is provided, the user joins that organization as `Analyst`.
- If `organizationName` is provided (or defaults), a new organization is created and the user becomes `Owner`.

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "owner",
      "organizationId": "uuid"
    },
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "jwt..."
    }
  }
}
```

---

### POST `/api/v1/auth/login`

Authenticate with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "...", "organizationId": "..." },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  }
}
```

**Errors:** `401` Invalid credentials.

---

### POST `/api/v1/auth/refresh`

Refresh expired access token.

**Body:**
```json
{
  "refreshToken": "jwt..."
}
```

**Response (200):**
```json
{
  "data": {
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  }
}
```

**Errors:** `401` Invalid or expired refresh token.

---

### GET `/api/v1/auth/me` 🔒

Get the currently authenticated user's profile.

**Response (200):**
```json
{
  "data": {
    "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "...", "organizationId": "..." }
  }
}
```

---

## Suppliers

All supplier endpoints are scoped to the authenticated user's organization (multi-tenant).

### GET `/api/v1/suppliers` 🔒 `supplier:read`

List suppliers with pagination, search, and filtering.

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | `created_at` | Sort field: `name`, `domain`, `category`, `risk_level`, `status`, `created_at` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `search` | string | — | Search by name or domain (case-insensitive) |
| `category` | string | — | Filter: `SaaS`, `Infrastructure`, `Consulting`, `Other` |
| `riskLevel` | string | — | Filter: `critical`, `high`, `medium`, `low` |
| `status` | string | — | Filter: `active`, `under_review`, `inactive` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Security",
      "domain": "acme.com",
      "category": "SaaS",
      "riskLevel": "high",
      "status": "active",
      "contractEndDate": null,
      "notes": "...",
      "organizationId": "uuid",
      "aiRiskScore": null,
      "aiAnalysis": null,
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "lastPage": 3, "perPage": 20 }
}
```

---

### GET `/api/v1/suppliers/:id` 🔒 `supplier:read`

Get a single supplier by ID.

**Response (200):**
```json
{
  "data": { "id": "uuid", "name": "...", "..." : "..." }
}
```

**Errors:** `404` Supplier not found (or belongs to another org).

---

### POST `/api/v1/suppliers` 🔒 `supplier:create`

Create a new supplier.

**Body:**
```json
{
  "name": "Acme Security",
  "domain": "acme-security.com",
  "category": "SaaS",
  "riskLevel": "high",
  "status": "active",
  "contractEndDate": "2026-12-31",
  "notes": "Optional notes"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | ✅ | 1–255 chars |
| `domain` | string | ✅ | 1–255 chars |
| `category` | enum | ✅ | `SaaS`, `Infrastructure`, `Consulting`, `Other` |
| `riskLevel` | enum | ✅ | `critical`, `high`, `medium`, `low` |
| `status` | enum | ✅ | `active`, `under_review`, `inactive` |
| `contractEndDate` | string | ❌ | ISO date |
| `notes` | string | ❌ | max 10000 chars |

**Response (201):** The created supplier object.

**Side effect:** An audit log entry `CREATE` is recorded.

---

### PUT `/api/v1/suppliers/:id` 🔒 `supplier:update`

Update an existing supplier. All fields are optional.

**Body:** Same fields as POST, all optional.

**Response (200):** The updated supplier object.

**Side effect:** An audit log entry `UPDATE` is recorded with before/after state.

---

### DELETE `/api/v1/suppliers/:id` 🔒 `supplier:delete`

Delete a supplier.

**Response (200):**
```json
{ "message": "Supplier deleted successfully" }
```

**Side effect:** An audit log entry `DELETE` is recorded with the before state.

---

## Audit Logs

Audit logs are **append-only** (no UPDATE or DELETE). They are scoped to the user's organization.

### GET `/api/v1/audit-logs` 🔒 `audit:read`

List audit logs with pagination and filtering.

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | `created_at` | `created_at`, `action`, `entity_type` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `action` | string | — | Filter: `CREATE`, `UPDATE`, `DELETE` |
| `entityType` | string | — | Filter by entity type (e.g., `supplier`) |
| `entityId` | uuid | — | Filter by entity ID |
| `userId` | uuid | — | Filter by user ID |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "user@example.com",
      "userFullName": "John Doe",
      "action": "CREATE",
      "entityType": "supplier",
      "entityId": "uuid",
      "before": null,
      "after": { "name": "Acme", "..." : "..." },
      "ipAddress": "::1",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "meta": { "total": 10, "page": 1, "lastPage": 1, "perPage": 20 }
}
```

---

### GET `/api/v1/audit-logs/:id` 🔒 `audit:read`

Get a single audit log entry by ID.

---

## Users

User management endpoints. Require `user:manage` permission (Owner only).

### GET `/api/v1/users` 🔒 `user:manage`

List users in the organization.

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | `created_at` | `email`, `full_name`, `role`, `created_at` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `role` | string | — | Filter: `owner`, `admin`, `analyst`, `auditor` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "admin",
      "organizationId": "uuid",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "lastPage": 1, "perPage": 20 }
}
```

---

### GET `/api/v1/users/:id` 🔒 `user:manage`

Get a single user by ID.

---

### POST `/api/v1/users` 🔒 `user:manage`

Create a new user in the organization.

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "fullName": "Jane Doe",
  "role": "admin"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | 8–128 chars |
| `fullName` | string | ✅ | 1–255 chars |
| `role` | enum | ✅ | `owner`, `admin`, `analyst`, `auditor` |

**Response (201):** The created user (without password).

---

### PUT `/api/v1/users/:id` 🔒 `user:manage`

Update a user's profile or role.

**Body:**
```json
{
  "fullName": "Updated Name",
  "role": "auditor"
}
```

**Response (200):** The updated user.

---

### DELETE `/api/v1/users/:id` 🔒 `user:manage`

Delete a user. Cannot delete yourself.

**Response (200):**
```json
{ "message": "User deleted successfully" }
```

---

## Error Responses

All errors follow this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (e.g., empty update body) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (RBAC / multi-tenant violation) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Validation Errors (422)

```json
{
  "errors": [
    { "message": "The email field must be a valid email address", "rule": "email", "field": "email" }
  ]
}
```

---

## Pagination

All list endpoints support server-side pagination.

| Param | Default | Max |
|-------|---------|-----|
| `page` | 1 | — |
| `limit` | 20 | 100 |

Response always includes a `meta` object:
```json
{
  "meta": {
    "total": 42,
    "page": 1,
    "lastPage": 3,
    "perPage": 20
  }
}
```

---

## RBAC Permissions

🔒 indicates a protected endpoint. The permission required is shown after the lock icon.

| Role | Permissions |
|------|------------|
| **Owner** | All permissions including `user:manage`, `org:delete` |
| **Admin** | `supplier:create`, `supplier:read`, `supplier:update`, `supplier:delete`, `audit:read`, `risk_policy:configure` |
| **Analyst** | `supplier:read`, `supplier:update_risk`, `supplier:add_notes` |
| **Auditor** | `supplier:read`, `audit:read` |

### Multi-tenant Isolation

- Every query is scoped by `organization_id`
- Users can **never** access data from another organization
- The `organization_id` is derived from the JWT token, never from client input
