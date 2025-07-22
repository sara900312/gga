import React from 'react';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArabicText } from '@/components/ui/arabic-text';
import { formatPrice } from '@/utils/currency';
import { Clock, User, Phone } from 'lucide-react';

interface SimpleOrderCardProps {
  order: Order;
  onAssign?: (orderId: string, storeId: string) => Promise<void>;
  onEdit?: (order: Order) => void;
  onViewDetails?: (orderId: string) => void;
  showAssignButton?: boolean;
}

export const SimpleOrderCard: React.FC<SimpleOrderCardProps> = ({ 
  order, 
  onViewDetails,
  showAssignButton = true
}) => {
  const statusInfo = {
    label: ORDER_STATUS_LABELS[order.order_status] || order.order_status,
    color: ORDER_STATUS_COLORS[order.order_status] || 'bg-gray-100 text-gray-800'
  };

  const totalFormatted = formatPrice(order.total_amount || 0, true);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <ArabicText>
                طلب #{order.order_code || order.id.slice(0, 8)}
              </ArabicText>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(order.created_at).toLocaleDateString('ar-EG')}
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
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm text-muted-foreground">العميل: </span>
              <ArabicText className="font-medium">{order.customer_name}</ArabicText>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm text-muted-foreground">الهاتف: </span>
              <span className="font-mono">{order.customer_phone}</span>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-medium">
            <ArabicText>المبلغ الإجمالي:</ArabicText>
          </span>
          <span className="font-bold text-primary font-mono">
            {totalFormatted.primary}
          </span>
        </div>

        {/* Customer Notes */}
        {order.customer_notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">ملاحظات العميل:</span>
            <div className="mt-1">
              <ArabicText className="text-sm">{order.customer_notes}</ArabicText>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
