import { CurrencyCode } from '../types/decision';

/**
 * Format currency with proper Indian numbering system (Lakhs, Crores) when INR,
 * or standard western formatting when USD/EUR.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  compact = false
): string {
  if (isNaN(amount) || !isFinite(amount)) return '—';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  if (compact) {
    if (currency === 'INR') {
      if (absAmount >= 10_000_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 10_000_000).toFixed(2)} Cr`;
      }
      if (absAmount >= 100_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 100_000).toFixed(2)} L`;
      }
      if (absAmount >= 1_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1_000).toFixed(1)}k`;
      }
    } else {
      if (absAmount >= 1_000_000_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1_000_000_000).toFixed(2)}B`;
      }
      if (absAmount >= 1_000_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1_000_000).toFixed(2)}M`;
      }
      if (absAmount >= 1_000) {
        return `${isNegative ? '-' : ''}${symbol}${(absAmount / 1_000).toFixed(1)}k`;
      }
    }
  }

  // Full representation
  if (currency === 'INR') {
    // Format using Indian Numbering (en-IN)
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}${symbol}${formatted}`;
  }

  const formatted = new Intl.NumberFormat(currency === 'EUR' ? 'de-DE' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatPercent(rate: number): string {
  if (isNaN(rate) || !isFinite(rate)) return '0%';
  return `${rate >= 0 ? '' : '-'}${Math.abs(rate).toFixed(1)}%`;
}

export function formatYears(years: number): string {
  if (years === 1) return '1 Year';
  return `${years} Years`;
}

export function formatMonths(months: number): string {
  if (months === 1) return '1 Month';
  if (months < 12) return `${months} Months`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return formatYears(y);
  return `${y}y ${m}m`;
}
