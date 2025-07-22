/**
 * Currency formatting utilities for Iraqi Dinars
 * دوال تنسيق العملة للدينار العراقي
 */

export const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 د.ع';

  // تنسيق الرقم مع فواصل الآلاف باستخدام التنسيق العراقي
  const formattedAmount = amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return `${formattedAmount} د.ع`;
};

// دالة مساعدة لتنسيق الأرقام فقط بدون كلمة "دينار"
export const formatNumber = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0';
  
  return amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

// دالة لتنسيق السعر مع التمييز بين السعر العادي والمخفض
export const formatPriceWithDiscount = (
  originalPrice: number,
  discountedPrice?: number | null
): {
  original: string;
  discounted: string | null;
  hasDiscount: boolean;
} => {
  return {
    original: formatCurrency(originalPrice),
    discounted: discountedPrice ? formatCurrency(discountedPrice) : null,
    hasDiscount: Boolean(discountedPrice && discountedPrice < originalPrice)
  };
};

// دالة لحساب نسبة الخصم
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountedPrice: number
): number => {
  if (originalPrice <= 0 || discountedPrice <= 0) return 0;
  if (discountedPrice >= originalPrice) return 0;
  
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// دالة شاملة لتنسيق عرض السعر مع جميع التفاصيل
export const formatProductPrice = (
  originalPrice: number,
  discountedPrice?: number | null,
  quantity: number = 1
): {
  displayPrice: string;
  originalPriceFormatted: string;
  discountedPriceFormatted: string | null;
  totalPrice: string;
  discountPercentage: number;
  hasDiscount: boolean;
} => {
  const hasDiscount = Boolean(discountedPrice && discountedPrice < originalPrice);
  const effectivePrice = hasDiscount ? discountedPrice! : originalPrice;
  const discountPercentage = hasDiscount ? calculateDiscountPercentage(originalPrice, discountedPrice!) : 0;
  
  return {
    displayPrice: formatCurrency(effectivePrice),
    originalPriceFormatted: formatCurrency(originalPrice),
    discountedPriceFormatted: discountedPrice ? formatCurrency(discountedPrice) : null,
    totalPrice: formatCurrency(effectivePrice * quantity),
    discountPercentage,
    hasDiscount
  };
};
