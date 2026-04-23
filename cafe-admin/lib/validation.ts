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
