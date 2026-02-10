import { useMemo, useState } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { DataTable, SortableColumnHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { useSuppliers, type SuppliersParams } from '@/hooks/queries/use-suppliers'
import {
  type Supplier,
  type RiskLevel,
  type SupplierStatus,
  DEFAULT_PAGE_SIZE,
} from '@mindlapse/shared'
import { formatDate } from '@/lib/utils'
import { formatStatus } from '@/lib/suppliers.utils'

const riskLevelVariants: Record<RiskLevel, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
}

const riskLevelColors: Record<RiskLevel, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
}

const statusVariants: Record<SupplierStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    active: 'default',
    inactive: 'secondary',
    under_review: 'outline',
  }

export function SuppliersTable() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const params: SuppliersParams = useMemo(() => {
    const baseParams: SuppliersParams = {
      page,
      limit: DEFAULT_PAGE_SIZE,
    }

    if (sorting.length > 0) {
      const sort = sorting[0]
      const columnMap: Record<string, SuppliersParams['sortBy']> = {
        name: 'name',
        domain: 'domain',
        riskLevel: 'risk_level',
        createdAt: 'created_at',
      }
      baseParams.sortBy = columnMap[sort.id] || (sort.id as SuppliersParams['sortBy'])
      baseParams.sortOrder = sort.desc ? 'desc' : 'asc'
    }

    return baseParams
  }, [page, sorting])

  const { data, isLoading } = useSuppliers(params)

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'domain',
        header: ({ column }) => <SortableColumnHeader column={column} title="Domain" />,
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue('domain')}</div>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const category = row.getValue('category') as string
          return <Badge variant="outline">{category.toUpperCase()}</Badge>
        },
      },
      {
        accessorKey: 'riskLevel',
        header: ({ column }) => <SortableColumnHeader column={column} title="Risk Level" />,
        cell: ({ row }) => {
          const riskLevel = row.getValue('riskLevel') as RiskLevel
          return (
            <Badge variant={riskLevelVariants[riskLevel]} className={riskLevelColors[riskLevel]}>
              {riskLevel.toUpperCase()}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as SupplierStatus
          return <Badge variant={statusVariants[status]}>{formatStatus(status)}</Badge>
        },
      },
      {
        accessorKey: 'aiRiskScore',
        header: 'AI Score',
        cell: ({ row }) => {
          const score = row.getValue('aiRiskScore') as number | null
          if (score === null || score === undefined) {
            return <span className="text-muted-foreground">Pending</span>
          }
          return <span className="font-mono">{score.toFixed(0)}/100</span>
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <SortableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string
          return <span className="text-muted-foreground">{formatDate(date)}</span>
        },
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={setSorting}
      onPageChange={setPage}
    />
  )
}
