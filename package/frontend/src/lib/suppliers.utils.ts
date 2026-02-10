import type { SupplierStatus } from '@mindlapse/shared'

export function formatStatus(status: SupplierStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'under_review':
      return 'Under Review'
    default:
      return 'N/A'
  }
}
