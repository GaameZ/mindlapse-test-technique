import { authStorage } from '@/lib/auth-storage'
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
  SupplierResponse,
  SuppliersListResponse,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  AuditLogsResponse,
  ApiError,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const accessToken = authStorage.getAccessToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Protection CSRF basique
      ...(options.headers as Record<string, string>),
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }))
      throw new Error(error.message || 'API Error')
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    return this.request<RefreshResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async me(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/v1/auth/me')
  }

  async getSuppliers(params?: URLSearchParams): Promise<SuppliersListResponse> {
    const query = params ? `?${params.toString()}` : ''
    return this.request<SuppliersListResponse>(`/api/v1/suppliers${query}`)
  }

  async getSupplier(id: string): Promise<SupplierResponse> {
    return this.request<SupplierResponse>(`/api/v1/suppliers/${id}`)
  }

  async createSupplier(data: CreateSupplierRequest): Promise<SupplierResponse> {
    return this.request<SupplierResponse>('/api/v1/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSupplier(id: string, data: UpdateSupplierRequest): Promise<SupplierResponse> {
    return this.request<SupplierResponse>(`/api/v1/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateSupplierRiskLevel(id: string, riskLevel: string): Promise<SupplierResponse> {
    return this.request<SupplierResponse>(`/api/v1/suppliers/${id}/risk-level`, {
      method: 'PATCH',
      body: JSON.stringify({ riskLevel }),
    })
  }

  async updateSupplierNotes(id: string, notes: string): Promise<SupplierResponse> {
    return this.request<SupplierResponse>(`/api/v1/suppliers/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    })
  }

  async deleteSupplier(id: string): Promise<void> {
    return this.request<void>(`/api/v1/suppliers/${id}`, {
      method: 'DELETE',
    })
  }

  async getSupplierAuditLogs(
    supplierId: string,
    params?: URLSearchParams
  ): Promise<AuditLogsResponse> {
    const query = params ? `?${params.toString()}` : ''
    return this.request<AuditLogsResponse>(`/api/v1/suppliers/${supplierId}/audit-logs${query}`)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
