import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatProductPrice } from '@/utils/currencyUtils';
import { 
  Package, User, Phone, MapPin, Calendar, 
  CheckCircle, Clock, XCircle, Eye, Store 
} from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    discounted_price?: number | null;
    main_store_name: string;
  };
}

interface OrderCardProps {
  order: {
    id: string;
    order_code?: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    order_status: string;
    total_amount: number;
    created_at: string;
    main_store_name?: string;
    assigned_store_name?: string;
    order_items?: OrderItem[];
    items?: any[]; // fallback for old format
  };
  onViewDetails?: (orderId: string) => void;
  onAssignOrder?: (orderId: string) => void;
  showAssignButton?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onViewDetails, 
  onAssignOrder,
  showAssignButton = false 
}) => {
  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      assigned: { label: 'معينة', variant: 'default' as const, icon: Package, color: 'bg-blue-100 text-blue-800' },
      delivered: { label: 'مسلمة', variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      completed: { label: 'مكتملة', variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      returned: { label: 'مرتجعة', variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'ملغية', variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800' },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || 
           { label: status, variant: 'secondary' as const, icon: Package, color: 'bg-gray-100 text-gray-800' };
  };

  const statusInfo = getStatusInfo(order.order_status);
  const StatusIcon = statusInfo.icon;
  const orderItems = order.order_items || order.items || [];

  // Calculate total with discounts
  const calculateTotalWithDiscounts = () => {
    if (!orderItems.length) return order.total_amount;
    
    return orderItems.reduce((total, item) => {
      const price = item.product?.discounted_price || item.product?.price || item.price || 0;
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const totalWithDiscounts = calculateTotalWithDiscounts();

  return (
    <Card className="order-card border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg">الطلب #{order.order_code || order.id.slice(0, 8)}</h3>
          </div>
          <Badge className={`${statusInfo.color} border-0`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* معلومات العميل */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">{order.customer_name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600" dir="ltr">{order.customer_phone}</span>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
            <span className="text-gray-600 line-clamp-2">{order.customer_address}</span>
          </div>
        </div>

        {/* المبلغ */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-green-800">إجمالي المبلغ:</span>
            <div className="text-right">
              <span className="font-bold text-lg text-green-700">
                {formatCurrency(totalWithDiscounts)}
              </span>
              {totalWithDiscounts !== order.total_amount && (
                <div className="text-xs text-gray-500 line-through">
                  {formatCurrency(order.total_amount)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* تاريخ الطلب */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(order.created_at).toLocaleDateString('ar-IQ', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* المنتجات */}
        {orderItems.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium mb-2 text-gray-700">المنتجات ({orderItems.length}):</h4>
            <div className="space-y-2">
              {orderItems.slice(0, 3).map((item: any, index: number) => {
                const productPrice = formatProductPrice(
                  item.product?.price || item.price || 0,
                  item.product?.discounted_price,
                  item.quantity || 1
                );
                
                return (
                  <div key={item.id || index} className="flex justify-between items-center text-sm bg-gray-50 rounded p-2">
                    <div className="flex-1">
                      <span className="font-medium">{item.product?.name || item.name || 'منتج غير محدد'}</span>
                      <span className="text-gray-500 mr-2">× {item.quantity || 1}</span>
                    </div>
                    <div className="text-right">
                      {productPrice.hasDiscount ? (
                        <div>
                          <div className="text-red-600 font-medium">
                            {productPrice.discountedPriceFormatted}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            {productPrice.originalPriceFormatted}
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium text-green-600">
                          {productPrice.displayPrice}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {orderItems.length > 3 && (
                <div className="text-center text-sm text-gray-500 py-1">
                  +{orderItems.length - 3} منتجات أخرى
                </div>
              )}
            </div>
          </div>
        )}

        {/* المتجر */}
        {(order.main_store_name || order.assigned_store_name) && (
          <div className="border-t pt-3">
            {order.assigned_store_name ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">المتجر المعين: {order.assigned_store_name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Store className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">المتجر الرئيسي: {order.main_store_name}</span>
              </div>
            )}
          </div>
        )}

        {/* أزرار العمل */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(order.id)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            عرض التفاصيل
          </Button>
          
          {showAssignButton && order.order_status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onAssignOrder?.(order.id)}
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-1" />
              تعيين المتجر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
