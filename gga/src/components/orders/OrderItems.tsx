import React from 'react';
import { OrderItem } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArabicText } from '@/components/ui/arabic-text';
import { formatPrice, convertSARToIQD } from '@/utils/currency';
import { Package, ShoppingCart } from 'lucide-react';

interface OrderItemsProps {
  items?: OrderItem[] | Array<{
    name?: string;
    quantity?: number;
    price?: number;
    main_store?: string;
    product_id?: number;
  }>;
  showPriceInBothCurrencies?: boolean;
  compact?: boolean;
}

export const OrderItems: React.FC<OrderItemsProps> = ({ 
  items, 
  showPriceInBothCurrencies = true,
  compact = false
}) => {
  if (!items || items.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-muted-foreground">
            <Package className="w-6 h-6 ml-2" />
            <ArabicText>لا توجد منتجات في هذا الطلب</ArabicText>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle both OrderItem[] and the legacy format
  const normalizedItems = items.map((item) => ({
    id: 'id' in item ? item.id : `item-${Math.random()}`,
    product_name: 'product_name' in item ? item.product_name : (item.name || 'منتج غير محدد'),
    quantity: item.quantity || 1,
    price_sar: 'price_sar' in item ? item.price_sar : (item.price || 0),
    price_iqd: 'price_iqd' in item ? item.price_iqd : undefined,
    product_image: 'product_image' in item ? item.product_image : undefined
  }));

  // Calculate total - prefer IQD if available, otherwise convert from SAR
  const totalIQD = normalizedItems.reduce((sum, item) => {
    if (item.price_iqd) {
      return sum + (item.price_iqd * item.quantity);
    } else {
      return sum + (convertSARToIQD(item.price_sar) * item.quantity);
    }
  }, 0);

  const totalSAR = normalizedItems.reduce((sum, item) => sum + (item.price_sar * item.quantity), 0);

  const totalFormatted = {
    iqd: `${totalIQD.toLocaleString('ar-EG')} د.ع`,
    sar: `${totalSAR.toLocaleString('ar-EG')} ر.س`,
    primary: showPriceInBothCurrencies ?
      `${totalIQD.toLocaleString('ar-EG')} د.ع (${totalSAR.toLocaleString('ar-EG')} ر.س)` :
      `${totalIQD.toLocaleString('ar-EG')} د.ع`
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShoppingCart className="w-4 h-4" />
          <ArabicText>المنتجات ({normalizedItems.length})</ArabicText>
        </div>
        {normalizedItems.map((item, index) => (
          <div key={item.id || index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <ArabicText className="font-medium text-blue-800">{item.product_name}</ArabicText>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    <ArabicText>الكمية: {item.quantity}</ArabicText>
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                  <span className="font-mono text-sm">
                    {item.price_iqd ?
                      `${item.price_iqd.toLocaleString('ar-EG')} د.ع` :
                      formatPrice(item.price_sar, false).iqd
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t pt-2">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-green-800">
                <ArabicText>الإجمالي:</ArabicText>
              </span>
              <span className="font-mono text-primary font-bold">
                {totalFormatted.primary}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <ArabicText>تفاصيل المنتجات ({normalizedItems.length})</ArabicText>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {normalizedItems.map((item, index) => (
          <div key={item.id || index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-lg text-blue-800 mb-3">
                  <ArabicText>{item.product_name}</ArabicText>
                </h4>
                <div className="flex gap-3 flex-wrap">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <ArabicText>الكمية: {item.quantity}</ArabicText>
                  </Badge>
                  <div className="bg-green-50 px-3 py-1 rounded border border-green-200">
                    <span className="font-mono text-green-700 font-semibold">
                      {item.price_iqd ?
                        `${item.price_iqd.toLocaleString('ar-EG')} د.ع` :
                        formatPrice(item.price_sar, false).iqd
                      }
                    </span>
                  </div>
                  {showPriceInBothCurrencies && (
                    <Badge variant="outline" className="text-xs text-muted-foreground border-gray-300">
                      <span className="font-mono">
                        {item.price_sar ?
                          `${item.price_sar.toLocaleString('ar-EG')} ر.س` :
                          formatPrice(item.price_iqd || 0, false).sar
                        }
                      </span>
                    </Badge>
                  )}
                </div>
                {item.quantity > 1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">المجموع: </span>
                    <span className="font-mono text-green-700">
                      {item.price_iqd ?
                        `${(item.price_iqd * item.quantity).toLocaleString('ar-EG')} د.ع` :
                        formatPrice(item.price_sar * item.quantity, false).iqd
                      }
                    </span>
                  </div>
                )}
              </div>
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded-lg ml-4 border border-gray-200"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-bold text-lg text-green-800">
                  <ArabicText>المجموع الكلي:</ArabicText>
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700 font-mono">
                  {totalFormatted.iqd}
                </div>
                {showPriceInBothCurrencies && (
                  <div className="text-sm text-muted-foreground font-mono">
                    ({totalFormatted.sar})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
