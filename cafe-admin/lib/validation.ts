export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  max: number,
  opts: { required?: boolean } = {}
): string | null {
  if (!value || !value.trim()) {
    return opts.required ? `${fieldName} is required` : null
  }
  if (value.length > max) {
    return `${fieldName} must be ${max} characters or fewer`
  }
  return null
}

export function validatePositiveNumber(
  value: number | string,
  fieldName: string,
  opts: { allowZero?: boolean; min?: number } = {}
): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${fieldName} must be a number`
  if (!opts.allowZero && num <= 0) return `${fieldName} must be greater than 0`
  if (opts.allowZero && num < 0) return `${fieldName} cannot be negative`
  if (opts.min !== undefined && num < opts.min) {
    return `${fieldName} must be at least ${opts.min}`
  }
  return null
}
