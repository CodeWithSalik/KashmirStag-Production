import { CURRENCY_SUBUNIT, CURRENCY_SYMBOL } from '@/config/constants';

/**
 * Convert a rupee amount (e.g. 499.00) to paise (49900).
 * Rounds to avoid floating-point drift.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * CURRENCY_SUBUNIT);
}

/**
 * Convert paise (49900) to rupees (499.00).
 */
export function toRupees(paise: number): number {
  return paise / CURRENCY_SUBUNIT;
}

/**
 * Format paise as a display string: ₹499.00
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatPrice(paise: number): string {
  const rupees = toRupees(paise);
  return `${CURRENCY_SYMBOL}${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Safe multiplication for money: lineTotal = unitPrice * quantity.
 * Both unitPrice and result are in paise (integers), so this is exact.
 */
export function lineTotal(unitPricePaise: number, quantity: number): number {
  return unitPricePaise * quantity;
}

/**
 * Sum an array of paise amounts.
 */
export function sumPaise(amounts: number[]): number {
  return amounts.reduce((sum, amt) => sum + amt, 0);
}
