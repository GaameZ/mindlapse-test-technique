import {
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { PaginationMeta } from '@mindlapse/shared'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: PaginationMeta
  isLoading?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  onPageChange?: (page: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  isLoading = false,
  sorting = [],
  onSortingChange,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
    },
    onSortingChange,
    pageCount: meta?.lastPage ?? 1,
  })

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-md border overflow-x-auto max-w-full">
        <Table className="min-w-200">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="pl-3" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <LoadingSpinner size="lg" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {meta && onPageChange && (
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Showing {(meta.page - 1) * meta.perPage + 1} to{' '}
            {Math.min(meta.page * meta.perPage, meta.total)} of {meta.total} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(meta.page - 1)}
                  aria-disabled={meta.page === 1 || isLoading}
                  className={
                    meta.page === 1 || isLoading
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              {Array.from({ length: meta.lastPage }, (_, i) => i + 1)
                .filter((pageNum) => {
                  return (
                    pageNum === 1 || pageNum === meta.lastPage || Math.abs(pageNum - meta.page) <= 1
                  )
                })
                .map((pageNum, idx, arr) => {
                  const prevPageNum = arr[idx - 1]
                  const showEllipsis = prevPageNum && pageNum - prevPageNum > 1

                  return (
                    <PaginationItem key={pageNum}>
                      {showEllipsis && <span className="px-2">...</span>}
                      <PaginationLink
                        onClick={() => onPageChange(pageNum)}
                        isActive={pageNum === meta.page}
                        className="cursor-pointer"
                        aria-disabled={isLoading}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(meta.page + 1)}
                  aria-disabled={meta.page === meta.lastPage || isLoading}
                  className={
                    meta.page === meta.lastPage || isLoading
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

interface SortableColumnHeaderProps {
  column: {
    id: string
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
  }
  title: string
}

export function SortableColumnHeader({ column, title }: SortableColumnHeaderProps) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className="-ml-4 h-8"
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}
