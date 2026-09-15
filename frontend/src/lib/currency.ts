/**
 * Currency utility for Ethiopian Birr (ETB)
 */

export const CURRENCY_CODE = 'ETB';
export const CURRENCY_SYMBOL = 'ETB';
export const CURRENCY_LOCALE = 'en-ET';

/**
 * Format amount as Ethiopian Birr
 * @param amount - The amount to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, options?: Intl.NumberFormatOptions): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${CURRENCY_SYMBOL} 0.00`;
  }

  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(numAmount);
}

/**
 * Format amount without currency symbol (for calculations)
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export function formatAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }

  return numAmount.toFixed(2);
}

/**
 * Parse currency string to number
 * @param currencyString - The currency string to parse
 * @returns The numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and formatting
  const cleaned = currencyString
    .replace(/[^\d.-]/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get currency display format for UI components
 * @returns Object with currency formatting options
 */
export function getCurrencyDisplay() {
  return {
    symbol: CURRENCY_SYMBOL,
    code: CURRENCY_CODE,
    locale: CURRENCY_LOCALE,
    format: (amount: number) => formatCurrency(amount),
  };
}
