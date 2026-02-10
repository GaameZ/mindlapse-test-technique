import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'
import {
  createSupplierSchema,
  type CreateSupplierFormData,
} from '@/lib/validations/supplier.schema'
import { useCreateSupplier } from '@/hooks/mutations/use-suppliers'
import {
  SUPPLIER_CATEGORIES,
  RISK_LEVELS,
  SUPPLIER_STATUSES,
  CATEGORY_LABELS,
  RISK_LEVEL_LABELS,
  STATUS_LABELS,
} from '@/lib/supplier-enums'

interface FormErrorProps {
  id?: string
  message?: string
}

function FormError({ id, message }: FormErrorProps) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function CreateSupplierDialog() {
  const [open, setOpen] = useState(false)
  const createSupplier = useCreateSupplier()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      domain: '',
      category: undefined,
      riskLevel: undefined,
      status: SupplierStatus.ACTIVE,
      contractEndDate: '',
      notes: '',
    },
  })

  const categoryValue = watch('category')
  const riskLevelValue = watch('riskLevel')
  const statusValue = watch('status')

  const onSubmit = async (data: CreateSupplierFormData) => {
    try {
      await createSupplier.mutateAsync({
        ...data,
        contractEndDate: data.contractEndDate || undefined,
        notes: data.notes || undefined,
      })
      reset()
      setOpen(false)
    } catch {
      // Error toast is handled by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Add a new supplier to your organization. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Supplier Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Amazon Web Services"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-required="true"
              autoComplete="organization"
            />
            <FormError id="name-error" message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm font-medium">
              Domain <span className="text-destructive">*</span>
            </label>
            <Input
              id="domain"
              {...register('domain')}
              placeholder="e.g., aws.amazon.com"
              aria-invalid={!!errors.domain}
              aria-describedby={errors.domain ? 'domain-error' : undefined}
              aria-required="true"
              autoComplete="url"
            />
            <FormError id="domain-error" message={errors.domain?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            <Select
              value={categoryValue}
              onValueChange={(value) =>
                setValue('category', value as SupplierCategory, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="category"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
                aria-required="true"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category as SupplierCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError id="category-error" message={errors.category?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="riskLevel" className="text-sm font-medium">
              Risk Level <span className="text-destructive">*</span>
            </label>
            <Select
              value={riskLevelValue}
              onValueChange={(value) =>
                setValue('riskLevel', value as RiskLevel, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="riskLevel"
                aria-invalid={!!errors.riskLevel}
                aria-describedby={errors.riskLevel ? 'riskLevel-error' : undefined}
                aria-required="true"
              >
                <SelectValue placeholder="Select a risk level" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {RISK_LEVEL_LABELS[level as RiskLevel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError id="riskLevel-error" message={errors.riskLevel?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status <span className="text-destructive">*</span>
            </label>
            <Select
              value={statusValue}
              onValueChange={(value) =>
                setValue('status', value as SupplierStatus, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="status"
                aria-invalid={!!errors.status}
                aria-describedby={errors.status ? 'status-error' : undefined}
                aria-required="true"
              >
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {SUPPLIER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status as SupplierStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError id="status-error" message={errors.status?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="contractEndDate" className="text-sm font-medium">
              Contract End Date
            </label>
            <Input
              id="contractEndDate"
              type="date"
              {...register('contractEndDate')}
              aria-invalid={!!errors.contractEndDate}
              aria-describedby={errors.contractEndDate ? 'contractEndDate-error' : undefined}
            />
            <FormError id="contractEndDate-error" message={errors.contractEndDate?.message} />
          </div>
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any additional notes about this supplier..."
              rows={4}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
            />
            <FormError id="notes-error" message={errors.notes?.message} />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Supplier'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
