import { useMemo, useState } from 'react'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { DataTable, SortableColumnHeader } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { SuppliersFilters } from '@/components/suppliers/suppliers-filters'
import { SupplierActions } from '@/components/suppliers/supplier-actions'
import { useSuppliers, type SuppliersParams } from '@/hooks/queries/use-suppliers'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  type Supplier,
  type RiskLevel,
  type SupplierStatus,
  type SupplierCategory,
  AiAnalysisStatus,
  DEFAULT_PAGE_SIZE,
} from '@mindlapse/shared'
import { formatDate } from '@/lib/utils'
import { CATEGORY_LABELS, RISK_LEVEL_LABELS, STATUS_LABELS } from '@/lib/supplier-enums'

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
  const navigate = useNavigate({ from: '/' })
  const searchParams = useSearch({ from: '/_authenticated/' })
  const [sorting, setSorting] = useState<SortingState>([])

  const [searchInput, setSearchInput] = useState(searchParams.search || '')
  const debouncedSearch = useDebouncedValue(searchInput, 500)

  useMemo(() => {
    if (debouncedSearch !== searchParams.search) {
      navigate({
        search: (prev) => ({
          ...prev,
          search: debouncedSearch || undefined,
          page: 1,
        }),
      })
    }
  }, [debouncedSearch, searchParams.search, navigate])

  const params: SuppliersParams = useMemo(() => {
    const baseParams: SuppliersParams = {
      page: searchParams.page || 1,
      limit: DEFAULT_PAGE_SIZE,
      search: searchParams.search,
      category: searchParams.category as SupplierCategory | undefined,
      riskLevel: searchParams.riskLevel as RiskLevel | undefined,
      status: searchParams.status as SupplierStatus | undefined,
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
  }, [searchParams, sorting])

  const { data, isLoading } = useSuppliers(params)

  const handlePageChange = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page }),
    })
  }

  const handleCategoryChange = (category: SupplierCategory | undefined) => {
    navigate({
      search: (prev) => ({ ...prev, category, page: 1 }),
    })
  }

  const handleRiskLevelChange = (riskLevel: RiskLevel | undefined) => {
    navigate({
      search: (prev) => ({ ...prev, riskLevel, page: 1 }),
    })
  }

  const handleStatusChange = (status: SupplierStatus | undefined) => {
    navigate({
      search: (prev) => ({ ...prev, status, page: 1 }),
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    navigate({
      search: {
        page: 1,
      },
    })
  }

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
          const category = row.getValue('category') as SupplierCategory
          return <Badge variant="outline">{CATEGORY_LABELS[category]}</Badge>
        },
      },
      {
        accessorKey: 'riskLevel',
        header: ({ column }) => <SortableColumnHeader column={column} title="Risk Level" />,
        cell: ({ row }) => {
          const riskLevel = row.getValue('riskLevel') as RiskLevel
          return (
            <Badge variant={riskLevelVariants[riskLevel]} className={riskLevelColors[riskLevel]}>
              {RISK_LEVEL_LABELS[riskLevel]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as SupplierStatus
          return <Badge variant={statusVariants[status]}>{STATUS_LABELS[status]}</Badge>
        },
      },
      {
        accessorKey: 'aiRiskScore',
        header: 'AI Score',
        cell: ({ row }) => {
          const score = row.getValue('aiRiskScore') as number | null
          const status = row.original.aiAnalysisStatus

          if (score === null || score === undefined) {
            const isError = status === AiAnalysisStatus.ERROR
            return (
              <Badge variant={isError ? 'destructive' : 'outline'} className="font-mono">
                {isError ? 'Error' : 'Pending'}
              </Badge>
            )
          }

          // Afficher le score si disponible
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const supplier = row.original
          return <SupplierActions supplier={supplier} />
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4">
      <SuppliersFilters
        search={searchInput}
        category={searchParams.category as SupplierCategory | undefined}
        riskLevel={searchParams.riskLevel as RiskLevel | undefined}
        status={searchParams.status as SupplierStatus | undefined}
        onSearchChange={setSearchInput}
        onCategoryChange={handleCategoryChange}
        onRiskLevelChange={handleRiskLevelChange}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
      />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        sorting={sorting}
        onSortingChange={setSorting}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
