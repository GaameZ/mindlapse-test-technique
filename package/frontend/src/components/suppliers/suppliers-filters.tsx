import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'

interface SuppliersFiltersProps {
  search?: string
  category?: SupplierCategory
  riskLevel?: RiskLevel
  status?: SupplierStatus
  onSearchChange: (value: string) => void
  onCategoryChange: (value: SupplierCategory | undefined) => void
  onRiskLevelChange: (value: RiskLevel | undefined) => void
  onStatusChange: (value: SupplierStatus | undefined) => void
  onClearFilters: () => void
}

export function SuppliersFilters({
  search,
  category,
  riskLevel,
  status,
  onSearchChange,
  onCategoryChange,
  onRiskLevelChange,
  onStatusChange,
  onClearFilters,
}: SuppliersFiltersProps) {
  const hasActiveFilters = search || category || riskLevel || status
  const categories = Object.values(SupplierCategory)
  const riskLevels = Object.values(RiskLevel)
  const statuses = Object.values(SupplierStatus)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="flex w-full md:w-2xs flex-col gap-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="search"
            placeholder="Search by name or domain..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <Select
            value={category || 'all'}
            onValueChange={(value) =>
              onCategoryChange(value === 'all' ? undefined : (value as SupplierCategory))
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="riskLevel" className="text-sm font-medium">
            Risk Level
          </label>
          <Select
            value={riskLevel || 'all'}
            onValueChange={(value) =>
              onRiskLevelChange(value === 'all' ? undefined : (value as RiskLevel))
            }
          >
            <SelectTrigger id="riskLevel">
              <SelectValue placeholder="All risk levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {riskLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select
            value={status || 'all'}
            onValueChange={(value) =>
              onStatusChange(value === 'all' ? undefined : (value as SupplierStatus))
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
