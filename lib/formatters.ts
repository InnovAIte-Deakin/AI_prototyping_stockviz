/**
 * Shared utility functions for formatting numbers, currency, and dates.
 * Follows DRY principles by centralizing logic used across multiple components.
 */

/**
 * Formats a number as USD currency.
 */
export const formatUsd = (n: number | null): string => {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/**
 * Formats a number as a percentage string with a sign (+/-).
 */
export const formatPct = (n: number | null): string => {
  if (n === null) return "—"
  const sign = n >= 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

/**
 * Formats a date string as "MMM D" (e.g., "May 16").
 */
export const formatWhen = (dateStr: string | null): string => {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

/**
 * Formats a large number with abbreviations (K, M, B, T).
 */
export const formatCompactNumber = (n: number | null): string => {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}
