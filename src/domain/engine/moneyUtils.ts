import { IntegerMoney } from '../models/types';

/**
 * Formats integer-based currency (in lowest denominator, e.g. paise/cents)
 * to a localized currency string.
 * Uses adaptive decimal precision:
 * - When showDecimals is 'auto' (default): drops '.00' for whole rupees (e.g. ₹5, ₹85,000),
 *   but preserves exact paise when present (e.g. ₹4.50, ₹100.75).
 * - When showDecimals is boolean: forces 2 or 0 decimals explicitly.
 */
export function formatCurrency(
  amount: IntegerMoney,
  currency = 'INR',
  showDecimals: boolean | 'auto' = 'auto'
): string {
  const isNegative = amount < 0;
  const absPaise = Math.abs(amount);
  const absUnits = absPaise / 100;
  const hasPaise = absPaise % 100 !== 0;

  const effectiveDecimals =
    showDecimals === 'auto'
      ? (hasPaise ? 2 : 0)
      : (showDecimals ? 2 : 0);

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  });

  const formatted = formatter.format(absUnits);
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Converts a decimal rupee number to integer paise
 * Example: 450.50 -> 45050
 */
export function rupeesToPaise(rupees: number): IntegerMoney {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to decimal rupees
 * Example: 45050 -> 450.5
 */
export function paiseToRupees(paise: IntegerMoney): number {
  return paise / 100;
}

/**
 * Parses a keypad input string into integer paise
 * Handles decimals correctly:
 * "450" -> 45000
 * "450.5" -> 45050
 * "450.75" -> 45075
 */
export function parseKeypadToPaise(input: string): IntegerMoney {
  if (!input || input === '0') return 0;
  const num = parseFloat(input);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
