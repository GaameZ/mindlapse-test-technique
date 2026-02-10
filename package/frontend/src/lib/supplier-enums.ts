import { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'

export const SUPPLIER_CATEGORIES = Object.values(SupplierCategory)

export const RISK_LEVELS = Object.values(RiskLevel)

export const SUPPLIER_STATUSES = Object.values(SupplierStatus)

export const CATEGORY_LABELS: Record<SupplierCategory, string> = {
  [SupplierCategory.SAAS]: 'SaaS',
  [SupplierCategory.INFRASTRUCTURE]: 'Infrastructure',
  [SupplierCategory.CONSULTING]: 'Consulting',
  [SupplierCategory.OTHER]: 'Other',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.CRITICAL]: 'Critical',
  [RiskLevel.HIGH]: 'High',
  [RiskLevel.MEDIUM]: 'Medium',
  [RiskLevel.LOW]: 'Low',
}

export const STATUS_LABELS: Record<SupplierStatus, string> = {
  [SupplierStatus.ACTIVE]: 'Active',
  [SupplierStatus.UNDER_REVIEW]: 'Under Review',
  [SupplierStatus.INACTIVE]: 'Inactive',
}
