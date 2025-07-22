/**
 * Currency conversion utilities for SAR to IQD
 * Re-export from currencyUtils for backward compatibility
 */

import {
  formatCurrency as formatCurrencyUtil,
  formatPriceWithDiscount,
  formatProductPrice,
  calculateDiscountPercentage
} from './currencyUtils';

export const EXCHANGE_RATES = {
  SAR_TO_IQD: 400,
  IQD_TO_SAR: 0.0025
} as const;

export const convertSARToIQD = (amountSAR: number): number => {
  if (!amountSAR || amountSAR < 0) return 0;
  return Math.round(amountSAR * EXCHANGE_RATES.SAR_TO_IQD);
};

export const convertIQDToSAR = (amountIQD: number): number => {
  if (!amountIQD || amountIQD < 0) return 0;
  return Math.round(amountIQD * EXCHANGE_RATES.IQD_TO_SAR * 100) / 100;
};

// Re-export the main currency formatting function
export const formatCurrency = formatCurrencyUtil;

// Display price as-is without conversion
export const formatPrice = (price: number): string => {
  return formatCurrency(price);
};

// Re-export additional utilities
export {
  formatPriceWithDiscount,
  formatProductPrice,
  calculateDiscountPercentage
};
