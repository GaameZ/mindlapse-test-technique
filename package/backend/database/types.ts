import { ColumnType, Generated, Insertable, JSONColumnType, Selectable, Updateable } from 'kysely'

export enum Role {
  owner = 'owner',
  admin = 'admin',
  analyst = 'analyst',
  auditor = 'auditor',
}

export enum SupplierCategory {
  SaaS = 'SaaS',
  Infrastructure = 'Infrastructure',
  Consulting = 'Consulting',
  Other = 'Other',
}

export enum RiskLevel {
  critical = 'critical',
  high = 'high',
  medium = 'medium',
  low = 'low',
}

export enum SupplierStatus {
  active = 'active',
  under_review = 'under_review',
  inactive = 'inactive',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

type CreatedAt = ColumnType<Date, string | undefined, never>

export interface Database {
  organizations: OrganizationTable
  users: UserTable
  suppliers: SupplierTable
  audit_logs: AuditLogTable
}

export interface OrganizationTable {
  id: Generated<string>
  name: string
  created_at: CreatedAt
}

export type Organization = Selectable<OrganizationTable>
export type NewOrganization = Insertable<OrganizationTable>
export type UpdateOrganization = Updateable<OrganizationTable>

export interface UserTable {
  id: Generated<string>
  email: string
  password_hash: string
  full_name: string
  role: Role
  organization_id: string
  created_at: CreatedAt
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UpdateUser = Updateable<UserTable>

export interface SupplierTable {
  id: Generated<string>
  name: string
  domain: string
  category: SupplierCategory
  risk_level: RiskLevel
  status: SupplierStatus
  contract_end_date: Date | null
  notes: string | null
  organization_id: string
  ai_risk_score: number | null
  ai_analysis: JSONColumnType<Record<string, unknown> | null>
  created_at: CreatedAt
}

export type Supplier = Selectable<SupplierTable>
export type NewSupplier = Insertable<SupplierTable>
export type UpdateSupplier = Updateable<SupplierTable>

export interface AuditLogTable {
  id: Generated<string>
  user_id: string
  action: AuditAction
  entity_type: string
  entity_id: string
  before: JSONColumnType<Record<string, unknown> | null>
  after: JSONColumnType<Record<string, unknown> | null>
  ip_address: string
  created_at: CreatedAt
}

export type AuditLog = Selectable<AuditLogTable>
export type NewAuditLog = Insertable<AuditLogTable>
