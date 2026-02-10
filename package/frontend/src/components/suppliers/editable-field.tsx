import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X, Edit2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useUpdateSupplier } from '@/hooks/mutations/use-suppliers'
import { usePermissions } from '@/hooks/use-permissions'
import { SupplierCategory, RiskLevel, SupplierStatus, type Permission } from '@mindlapse/shared'
import {
  SUPPLIER_CATEGORIES,
  RISK_LEVELS,
  SUPPLIER_STATUSES,
  CATEGORY_LABELS,
  RISK_LEVEL_LABELS,
  STATUS_LABELS,
} from '@/lib/supplier-enums'

interface EditableFieldProps {
  label: string
  field: string
  value: string | null | undefined
  supplierId: string
  type: 'text' | 'textarea' | 'date' | 'select'
  options?: 'category' | 'riskLevel' | 'status'
  requiredPermission?: Permission
}

const SELECT_OPTIONS_CONFIG = {
  category: {
    values: SUPPLIER_CATEGORIES,
    labels: CATEGORY_LABELS as Record<string, string>,
    placeholder: 'Select a category',
  },
  riskLevel: {
    values: RISK_LEVELS,
    labels: RISK_LEVEL_LABELS as Record<string, string>,
    placeholder: 'Select a risk level',
  },
  status: {
    values: SUPPLIER_STATUSES,
    labels: STATUS_LABELS as Record<string, string>,
    placeholder: 'Select a status',
  },
} as const

export function EditableField({
  label,
  field,
  value,
  supplierId,
  type,
  options,
  requiredPermission = 'supplier:update',
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { mutate: updateSupplier, isPending } = useUpdateSupplier()
  const { can } = usePermissions()

  const canEdit = can(requiredPermission)

  const schema = z.object({
    [field]: z.string().optional(),
  })

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [field]: value || '',
    },
  })

  const currentValue = watch(field)

  const onSubmit = (data: any) => {
    updateSupplier(
      {
        id: supplierId,
        data: {
          [field]: data[field] || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const handleCancel = () => {
    reset({ [field]: value || '' })
    setIsEditing(false)
  }

  const getDisplayValue = () => {
    if (!value) return <span className="text-muted-foreground italic">Not set</span>

    if (options === 'category') return CATEGORY_LABELS[value as SupplierCategory]
    if (options === 'riskLevel') return RISK_LEVEL_LABELS[value as RiskLevel]
    if (options === 'status') return STATUS_LABELS[value as SupplierStatus]
    if (type === 'date') return new Date(value).toLocaleDateString()

    return value
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {!isEditing && canEdit && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8">
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="text-base">{getDisplayValue()}</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {type === 'text' && (
            <Input {...register(field)} placeholder={`Enter ${label.toLowerCase()}`} />
          )}

          {type === 'textarea' && (
            <Textarea {...register(field)} rows={4} placeholder={`Enter ${label.toLowerCase()}`} />
          )}

          {type === 'date' && <Input {...register(field)} type="date" />}

          {type === 'select' && options && (
            <Select value={currentValue} onValueChange={(val) => setValue(field, val)}>
              <SelectTrigger>
                <SelectValue placeholder={SELECT_OPTIONS_CONFIG[options].placeholder} />
              </SelectTrigger>
              <SelectContent>
                {SELECT_OPTIONS_CONFIG[options].values.map((optionValue) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {SELECT_OPTIONS_CONFIG[options].labels[optionValue]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="h-8">
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Save
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="h-8"
            >
              <X className="mr-2 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
