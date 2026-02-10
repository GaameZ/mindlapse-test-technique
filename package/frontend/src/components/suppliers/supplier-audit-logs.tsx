import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { useSupplierAuditLogs } from '@/hooks/queries/use-suppliers'
import { formatDate } from '@/lib/utils'
import { AuditAction } from '@mindlapse/shared'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface SupplierAuditLogsProps {
  supplierId: string
}

const actionVariants: Record<AuditAction, 'default' | 'secondary' | 'destructive'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
}

export function SupplierAuditLogs({ supplierId }: SupplierAuditLogsProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSupplierAuditLogs(supplierId, { page, limit: 10 })

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>History of changes made to this supplier</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No audit logs yet</p>
        ) : (
          <div className="flex flex-col gap-4">
            {data.data.map((log) => (
              <div
                key={log.id}
                className="border-l-2 border-muted pl-4 py-2 flex flex-col gap-2 hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={actionVariants[log.action]}>{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {log.entityType} • {log.ipAddress}
                </p>
                {log.after && log.action === AuditAction.UPDATE && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View changes
                    </summary>
                    <div className="mt-2 flex flex-col gap-1">
                      {Object.entries(log.after as Record<string, any>).map(([key, value]) => {
                        const beforeValue = (log.before as Record<string, any>)?.[key]
                        if (beforeValue === value) return null

                        return (
                          <div key={key} className="pl-2 border-l border-muted">
                            <span className="font-medium">{key}:</span>{' '}
                            {beforeValue !== undefined && (
                              <span className="line-through text-destructive">
                                {String(beforeValue)}
                              </span>
                            )}{' '}
                            <span className="text-green-600">{String(value)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )}
              </div>
            ))}
            {data.meta && data.meta.lastPage > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-4">
                      {page} of {data.meta.lastPage}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(data.meta!.lastPage, p + 1))}
                      className={
                        page === data.meta.lastPage
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
