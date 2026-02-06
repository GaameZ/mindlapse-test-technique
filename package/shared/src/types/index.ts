export enum SupplierCategory {
  SAAS = 'saas',
  INFRASTRUCTURE = 'infrastructure',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  INACTIVE = 'inactive',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  AUDITOR = 'auditor',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

// --- Interfaces ---

export interface Organization {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  domain: string
  category: SupplierCategory
  riskLevel: RiskLevel
  status: SupplierStatus
  contractEndDate: string | null
  notes: string | null
  organizationId: string
  aiRiskScore: number | null
  aiAnalysis: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress: string
  createdAt: string
}
