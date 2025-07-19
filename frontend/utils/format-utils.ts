/**
 * Format a number as currency
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number as price (alias for formatCurrency)
 */
export function formatPrice(amount: number | undefined | null): string {
  return formatCurrency(amount)
}

/**
 * Format a date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return `${value}%`
}

/**
 * Calculate discount price from original price and discount percent
 */
export function calculateDiscountPrice(price: number, discountPercent: number): number {
  return price - (price * discountPercent) / 100
}
