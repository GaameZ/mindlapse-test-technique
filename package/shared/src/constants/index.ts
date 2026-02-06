import { Role } from '../types/index.js'

export const ROLES = Object.values(Role)

export const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_SORT_BY = 'created_at'
export const DEFAULT_SORT_ORDER = 'desc'
