import type { User, Supplier, AuditLog, Tokens, PaginationMeta, ApiError } from '@mindlapse/shared'

export type { Tokens, PaginationMeta, ApiError }

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  data: {
    tokens: Tokens
  }
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  data: {
    tokens: Tokens
  }
}

export interface MeResponse {
  data: {
    user: User
  }
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  organizationName?: string
  organizationId?: string
}

export interface RegisterResponse {
  data: {
    tokens: Tokens
  }
}

// --- Suppliers Requests/Responses ---

export interface CreateSupplierRequest {
  name: string
  domain: string
  category: string
  riskLevel: string
  status: string
  contractEndDate?: string | null
  notes?: string | null
}

export interface UpdateSupplierRequest {
  name?: string
  domain?: string
  category?: string
  riskLevel?: string
  status?: string
  contractEndDate?: string | null
  notes?: string | null
}

export interface SupplierResponse {
  data: Supplier
}

export interface SuppliersListResponse {
  data: Supplier[]
  meta: PaginationMeta
}

// --- Audit Logs Responses ---

export interface AuditLogsResponse {
  data: AuditLog[]
  meta: PaginationMeta
}

// --- Pagination ---

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
