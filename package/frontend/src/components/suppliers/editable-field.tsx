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
import {
  useUpdateSupplier,
  useUpdateSupplierRiskLevel,
  useUpdateSupplierNotes,
} from '@/hooks/mutations/use-suppliers'
import { usePermissions } from '@/hooks/use-permissions'
import {
  SupplierCategory,
  RiskLevel,
  SupplierStatus,
  type Permission,
  NOTES_REGEX,
  NOTES_MAX_LENGTH,
} from '@mindlapse/shared'
import { FormError } from '@/components/ui/form-error'
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

  const { mutate: updateSupplier, isPending: isUpdatingSupplier } = useUpdateSupplier()
  const { mutate: updateRiskLevel, isPending: isUpdatingRiskLevel } = useUpdateSupplierRiskLevel()
  const { mutate: updateNotes, isPending: isUpdatingNotes } = useUpdateSupplierNotes()

  const { can } = usePermissions()

  const canEdit = can(requiredPermission)

  // Déterminer quelle mutation et quel isPending utiliser
  const isPending =
    field === 'riskLevel'
      ? isUpdatingRiskLevel
      : field === 'notes'
        ? isUpdatingNotes
        : isUpdatingSupplier

  const getFieldSchema = () => {
    const requiredFields = ['name', 'domain', 'category', 'riskLevel', 'status']
    const isRequired = requiredFields.includes(field)

    if (field === 'notes') {
      return z
        .string()
        .max(NOTES_MAX_LENGTH, `Notes are too long (max ${NOTES_MAX_LENGTH} characters)`)
        .regex(
          NOTES_REGEX,
          'Notes contain forbidden characters. HTML tags (< >) and some special characters are not allowed for security reasons.'
        )
        .optional()
    }

    if (field === 'domain') {
      const domainSchema = z
        .string()
        .regex(
          /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
          'Invalid domain format (e.g., example.com)'
        )

      return isRequired ? domainSchema.min(1, 'Domain is required') : domainSchema.optional()
    }

    if (field === 'name') {
      return z
        .string()
        .min(1, 'Supplier name is required')
        .min(2, 'Supplier name must be at least 2 characters')
        .max(255, 'Supplier name is too long')
    }

    if (isRequired) {
      return z.string().min(1, `${label} is required`)
    }

    return z.string().optional()
  }

  const schema = z.object({
    [field]: getFieldSchema(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [field]: value || '',
    },
  })

  const currentValue = watch(field)

  const onSubmit = (data: Record<string, string | undefined>) => {
    const newValue = data[field] || undefined

    if (field === 'riskLevel') {
      if (!newValue) return
      updateRiskLevel(
        { id: supplierId, riskLevel: newValue },
        {
          onSuccess: () => {
            setIsEditing(false)
          },
        }
      )
    } else if (field === 'notes') {
      updateNotes(
        { id: supplierId, notes: newValue || '' },
        {
          onSuccess: () => {
            setIsEditing(false)
          },
        }
      )
    } else {
      updateSupplier(
        {
          id: supplierId,
          data: {
            [field]: newValue,
          },
        },
        {
          onSuccess: () => {
            setIsEditing(false)
          },
        }
      )
    }
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
    <div className="flex flex-col gap-2">
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          {type === 'text' && (
            <>
              <Input {...register(field)} placeholder={`Enter ${label.toLowerCase()}`} />
              {errors[field] && (
                <FormError id={`${field}-error`} message={errors[field]?.message} />
              )}
            </>
          )}

          {type === 'textarea' && (
            <>
              <Textarea
                {...register(field)}
                rows={4}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
              {errors[field] && (
                <FormError id={`${field}-error`} message={errors[field]?.message} />
              )}
            </>
          )}

          {type === 'date' && (
            <>
              <Input {...register(field)} type="date" />
              {errors[field] && (
                <FormError id={`${field}-error`} message={errors[field]?.message} />
              )}
            </>
          )}

          {type === 'select' && options && (
            <>
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
              {errors[field] && (
                <FormError id={`${field}-error`} message={errors[field]?.message} />
              )}
            </>
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
