import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLES, ROLE_LABELS } from '@/lib/user-roles'

interface UsersFiltersProps {
  roleFilter: string
  onRoleFilterChange: (value: string) => void
}

export function UsersFilters({ roleFilter, onRoleFilterChange }: UsersFiltersProps) {
  return (
    <div className="flex gap-4">
      <div>
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
