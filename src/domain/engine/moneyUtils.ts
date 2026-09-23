import { IntegerMoney } from '../models/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'S$',
  CHF: 'CHF',
};

/**
 * Returns the currently active currency ISO code (defaults to 'INR')
 */
export function getActiveCurrencyCode(): string {
  try {
    return localStorage.getItem('app_currency_code') || 'INR';
  } catch {
    return 'INR';
  }
}

/**
 * Returns the currently active currency symbol (defaults to '₹')
 */
export function getActiveCurrencySymbol(): string {
  const code = getActiveCurrencyCode();
  return CURRENCY_SYMBOLS[code] || '₹';
}

/**
 * Formats integer-based currency (in lowest denominator, e.g. paise/cents)
 * to a localized currency string.
 * Uses active app currency, symbol, and numbering system by default.
 * Uses adaptive decimal precision:
 * - When showDecimals is 'auto' (default): drops '.00' for whole numbers (e.g. ₹5, ₹85,000),
 *   but preserves exact paise when present (e.g. ₹4.50, ₹100.75).
 * - When showDecimals is boolean: forces 2 or 0 decimals explicitly.
 */
export function formatCurrency(
  amount: IntegerMoney,
  currency?: string,
  showDecimals: boolean | 'auto' = 'auto'
): string {
  const effectiveCurrency = currency || getActiveCurrencyCode();
  let numbering = 'indian';
  try {
    numbering =
      localStorage.getItem('app_numbering_system') ||
      (effectiveCurrency === 'INR' ? 'indian' : 'international');
  } catch {
    numbering = effectiveCurrency === 'INR' ? 'indian' : 'international';
  }

  const isNegative = amount < 0;
  const absPaise = Math.abs(amount);
  const absUnits = absPaise / 100;
  const hasPaise = absPaise % 100 !== 0;

  let effectiveDecimals = 0;
  if (effectiveCurrency === 'JPY') {
    effectiveDecimals = 0;
  } else if (showDecimals === 'auto') {
    let savedDecMode = 'auto';
    try {
      savedDecMode = localStorage.getItem('app_decimal_mode') || 'auto';
    } catch {
      savedDecMode = 'auto';
    }
    effectiveDecimals = savedDecMode === 'always' ? 2 : (hasPaise ? 2 : 0);
  } else {
    effectiveDecimals = showDecimals ? 2 : 0;
  }

  const locale = numbering === 'indian' ? 'en-IN' : 'en-US';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: effectiveCurrency,
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

/**
 * Formats currency adaptively for dashboard cards and sub-cards:
 * 1. Default / Standard values (< ₹1,00,000 / 1 Lakh for sub-cards; < ₹10,00,000 for hero):
 *    Displays full 2 decimals (e.g. ₹85,000.00, ₹32,150.00, ₹1,42,850.00).
 * 2. Large values (≥ ₹1,00,000 / 1 Lakh for sub-cards; ≥ ₹10,00,000 for hero):
 *    Trims decimal pointers (.00) first to ensure the entire integer value
 *    before the decimal is fully visible without clipping (e.g. ₹1,85,000, ₹12,50,000).
 * 3. Extremely large values (≥ ₹1 Crore / 10M+ for sub-cards; ≥ ₹100 Crores for hero):
 *    Falls back to compact representation (e.g. ₹1.5Cr, ₹25Cr) so the figure
 *    fits cleanly within the container boundary.
 */
export function formatAdaptiveCardCurrency(
  amount: IntegerMoney,
  isSubCard = true,
  currency?: string,
  trimDecimals = false
): string {
  const effectiveCurrency = currency || getActiveCurrencyCode();
  let numbering = 'indian';
  try {
    numbering =
      localStorage.getItem('app_numbering_system') ||
      (effectiveCurrency === 'INR' ? 'indian' : 'international');
  } catch {
    numbering = effectiveCurrency === 'INR' ? 'indian' : 'international';
  }

  const isNegative = amount < 0;
  const absPaise = Math.abs(amount);
  const absUnits = absPaise / 100;
  const locale = numbering === 'indian' ? 'en-IN' : 'en-US';
  const hasPaise = absPaise % 100 !== 0;

  let formatted = '';

  if (isSubCard) {
    // Extremely large: >= ₹1 Crore (10,000,000 rupees)
    if (absUnits >= 10000000) {
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(absUnits);
    }
    // Large: >= ₹1 Lakh (100,000 rupees) -> Priority 1: Trim decimals, show full integer value
    else if (absUnits >= 100000) {
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absUnits);
    }
    // Normal / Standard: Show full 2 decimals, or 0 if whole number when trimDecimals is true
    else {
      const decimals = trimDecimals && !hasPaise ? 0 : 2;
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(absUnits);
    }
  } else {
    // Hero Balance
    // Extremely large: >= ₹100 Crores (or >= ₹1 Crore when trimDecimals is true)
    if (absUnits >= 1000000000 || (trimDecimals && absUnits >= 10000000)) {
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(absUnits);
    }
    // Large: >= ₹1 Crore -> Trim decimals
    else if (absUnits >= 10000000) {
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(absUnits);
    }
    // Normal: Show full 2 decimals (including ₹1,42,850.00)
    else {
      const decimals = trimDecimals && !hasPaise ? 0 : 2;
      formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: effectiveCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(absUnits);
    }
  }

  return isNegative ? `-${formatted}` : formatted;
}

