import type {
  User,
  Supplier,
  AuditLog,
  Tokens,
  PaginationMeta,
  ApiError,
  Role,
} from '@mindlapse/shared'

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

export interface CreateUserRequest {
  email: string
  password: string
  fullName: string
  role: Role
}

export interface UpdateUserRequest {
  fullName?: string
  role?: Role
}

export interface UserResponse {
  data: User
}

export interface UsersListResponse {
  data: User[]
  meta: PaginationMeta
}

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

export interface AuditLogsResponse {
  data: AuditLog[]
  meta: PaginationMeta
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
