import React, { useState } from 'react';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArabicText } from '@/components/ui/arabic-text';
import { OrderItems } from './OrderItems';
import { formatPrice, convertSARToIQD } from '@/utils/currency';
import { OrderService } from '@/services/orderService';
import { 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  Store as StoreIcon,
  Edit,
  CheckCircle,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

interface EnhancedOrderCardProps {
  order: Order;
  onAssign?: (orderId: string, storeId: string) => Promise<void>;
  onEdit?: (order: Order) => void;
  onViewDetails?: (orderId: string) => void;
  compact?: boolean;
  showAssignButton?: boolean;
}

export const EnhancedOrderCard: React.FC<EnhancedOrderCardProps> = ({ 
  order, 
  onAssign, 
  onEdit,
  onViewDetails,
  compact = false,
  showAssignButton = true
}) => {
  const [isAssigning, setIsAssigning] = useState(false);

  const statusInfo = {
    label: ORDER_STATUS_LABELS[order.order_status] || order.order_status,
    color: ORDER_STATUS_COLORS[order.order_status] || 'bg-gray-100 text-gray-800'
  };

  // Safe date formatting without external locale
  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'الآن';
      if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
      if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
      return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
    } catch (error) {
      console.error('Time ago formatting error:', error);
      return 'و��ت غير محدد';
    }
  };

  // Process order to ensure proper currency conversion
  const processedOrder = OrderService.normalizeOrderAmounts(order);

  // Use IQD as primary currency
  const totalIQD = processedOrder.total_amount_iqd || convertSARToIQD(order.total_amount || 0);
  const totalSAR = processedOrder.total_amount_sar || order.total_amount || 0;

  const totalFormatted = {
    iqd: `${totalIQD.toLocaleString('ar-EG')} د.ع`,
    sar: `${totalSAR.toLocaleString('ar-EG')} ر.س`,
    primary: `${totalIQD.toLocaleString('ar-EG')} د.ع (${totalSAR.toLocaleString('ar-EG')} ر.س)`
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(order);
    }
  };

  if (compact) {
    return (
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg">
                <ArabicText>
                  طلب #{order.order_code || order.id.slice(0, 8)}
                </ArabicText>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <ArabicText className="font-medium">{order.customer_name}</ArabicText>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              <ArabicText>{statusInfo.label}</ArabicText>
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono">{order.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-primary font-bold">
                {totalFormatted.iqd}
              </span>
            </div>
          </div>

          {processedOrder.items && processedOrder.items.length > 0 && (
            <OrderItems items={processedOrder.items} compact={true} />
          )}

          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <ArabicText>التفاصيل</ArabicText>
            </Button>
            
            {order.order_status === 'pending' && showAssignButton && (
              <Button 
                size="sm"
                onClick={handleEdit}
                className="flex-1"
                disabled={isAssigning}
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                <ArabicText>تعيين</ArabicText>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArabicText>
                طلب #{order.order_code || order.id.slice(0, 8)}
              </ArabicText>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(order.created_at)}</span>
              <span className="text-xs">
                ({formatOrderDate(order.created_at)})
              </span>
            </div>
          </div>
          <Badge className={statusInfo.color}>
            <ArabicText>{statusInfo.label}</ArabicText>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">العميل: </span>
                <ArabicText className="font-medium">{order.customer_name}</ArabicText>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div className="font-mono">
                <p style={{textIndent: '1em'}}>{order.customer_phone}</p>
              </div>
              <span className="text-sm text-muted-foreground">الهاتف: </span>
            </div>

            {order.customer_address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <span className="text-sm text-muted-foreground">العنوان: </span>
                  <ArabicText className="font-medium">{order.customer_address}</ArabicText>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">المبلغ الإجمالي: </span>
                <div className="font-bold text-primary font-mono">
                  <div className="text-lg">{totalFormatted.iqd}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">تاريخ الطلب: </span>
                <span className="font-medium">
                  {formatOrderDate(order.created_at)}
                </span>
              </div>
            </div>

            {(order.assigned_store_name || order.main_store_name) && (
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">
                    {order.assigned_store_name ? 'الم��جر المعين: ' : 'المتجر الرئيسي: '}
                  </span>
                  <ArabicText className="font-medium text-blue-600">
                    {order.assigned_store_name || order.main_store_name}
                  </ArabicText>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Notes */}
        {order.customer_notes && (
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <span className="text-sm font-medium text-muted-foreground">ملاحظات ا��عميل:</span>
              <div className="mt-1">
                <ArabicText className="text-sm">{order.customer_notes}</ArabicText>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {(processedOrder.items && processedOrder.items.length > 0) || (processedOrder.order_items && processedOrder.order_items.length > 0) ? (
          <OrderItems
            items={processedOrder.order_items || processedOrder.items}
            showPriceInBothCurrencies={true}
          />
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            <ArabicText>التفاصيل</ArabicText>
          </Button>
          
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <ArabicText>تعديل</ArabicText>
            </Button>
          )}
          

        </div>
      </CardContent>
    </Card>
  );
};
