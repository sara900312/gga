import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEdgeFunctions } from '@/hooks/useEdgeFunctions';
import { formatCurrency } from '@/utils/currency';
import { 
  User, Phone, MapPin, FileText, Store, Package, 
  Calendar, DollarSign, RefreshCw, CheckCircle, Clock 
} from 'lucide-react';

interface OrderDetailsProps {
  orderId: string;
  stores?: Array<{ id: string; name: string }>;
  onOrderUpdated?: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, stores = [], onOrderUpdated }) => {
  const [orderData, setOrderData] = useState<any>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const { callEdgeFunction, getOrder, assignOrder, loading, isAssigning } = useEdgeFunctions();

  const loadOrderData = async () => {
    if (!orderId) {
      console.warn("⚠️ loadOrderData called without orderId");
      return;
    }

    try {
      console.log("🔵 loadOrderData: Starting to load order data for:", orderId);

      // Try new callEdgeFunction first, fallback to getOrder
      let data;
      try {
        console.log("🔵 Trying callEdgeFunction...");
        data = await callEdgeFunction('get-order', { orderId });
        console.log("✅ callEdgeFunction successful:", data);
      } catch (err) {
        console.log("⚠️ callEdgeFunction failed, trying getOrder fallback...", err);
        data = await getOrder(orderId);
        console.log("✅ getOrder fallback successful:", data);
      }

      if (data) {
        setOrderData(data);
        console.log("📋 Order data loaded and set:", data);
      } else {
        console.warn("⚠️ No data received from order loading");
      }
    } catch (err) {
      console.error('❌ Failed to fetch order details:', err);
      // Don't show toast here as useEdgeFunctions already handles it
    }
  };

  useEffect(() => {
    if (orderId) {
      console.log("🔄 OrderDetails: Loading data for orderId:", orderId);
      loadOrderData();
    }
  }, [orderId]); // Only run when orderId changes

  const handleAssignOrder = async () => {
    if (!selectedStoreId || !orderId) return;

    const success = await assignOrder(orderId, selectedStoreId);
    if (success) {
      // إعادة تحميل بيانات الطلب لتحديث الواجهة
      await loadOrderData();
      setSelectedStoreId('');
      onOrderUpdated?.();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const, icon: Clock },
      assigned: { label: 'معينة', variant: 'default' as const, icon: Package },
      delivered: { label: 'مسلمة', variant: 'default' as const, icon: CheckCircle },
      completed: { label: 'مسلمة', variant: 'default' as const, icon: CheckCircle },
      returned: { label: 'مرتجعة', variant: 'destructive' as const, icon: RefreshCw },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || 
           { label: status, variant: 'secondary' as const, icon: Package };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>جارٍ تحميل تفاصيل الطلب...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orderData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            لم يتم العثور على بيانات الطلب
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle both new and old response structures
  const order = orderData.order || orderData;
  const orderItems = orderData.order_items || order.items || [];
  const assignedStore = orderData.assigned_store;

  const statusInfo = getStatusBadge(order.order_status || order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* رأس الطلب */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              الطلب
            </CardTitle>
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* معلومات العميل */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">معلومات العميل</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">اسم العميل:</span>
                  <span>{order.customer_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">رقم الهاتف:</span>
                  <span dir="ltr">{order.customer_phone}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                  <span className="font-medium">العنوان:</span>
                  <span>{order.customer_address}</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-1" />
                  <span className="font-medium">ملاحظات:</span>
                  <span className="text-gray-600">
                    {order.customer_notes || 'لا توجد ملاحظات'}
                  </span>
                </div>
              </div>
            </div>

            {/* تفاصيل الطلب */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">تفاصيل الطلب</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="font-medium">تاريخ الطلب:</span>
                  <span>
                    {new Date(order.created_at).toLocaleString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">إجمالي المبلغ:</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">المتجر الرئيسي:</span>
                  <span className="text-blue-600 font-medium">
                    {order.main_store_name}
                  </span>
                </div>
                
                {(order.assigned_store_name || assignedStore?.name) && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">المتجر المعين:</span>
                    <span className="text-green-600 font-medium">
                      {order.assigned_store_name || assignedStore?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المنتجات */}
      {orderItems && orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              المنتجات ({orderItems.length} منتج)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderItems.map((item: any, index: number) => (
                <div key={item.id || index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-blue-800 mb-2">
                        {item.product?.name || item.name || 'منتج غير محدد'}
                      </h4>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">الكمية:</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {item.quantity || 1}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-700">المتجر:</span>
                          <span className="text-purple-600 font-medium">
                            {item.product?.main_store_name ||
                             item.main_store_name ||
                             item.main_store ||
                             order.main_store_name ||
                             'hawranj'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                        {item.product?.discounted_price ? (
                          <>
                            <p className="text-gray-500 line-through text-sm">
                              {formatCurrency(item.product.price)}
                            </p>
                            <p className="text-red-600">
                              {formatCurrency(item.product.discounted_price)}
                            </p>
                            <p className="text-xs text-green-600">خصم متاح!</p>
                          </>
                        ) : (
                          <>
                            {formatCurrency(item.product?.price || item.price || 0)}
                          </>
                        )}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-600 mt-1">
                          المجموع: {formatCurrency((item.product?.price || item.price || 0) * (item.quantity || 1))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* إجمالي السعر */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-lg text-green-800">إجمالي الطلب:</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قسم التعيين (فقط للطلبات المعلقة) */}
      {(order.order_status === 'pending' || order.status === 'pending') && stores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تعيين الطلب للمتجر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  اختر المتجر
                </label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المتجر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAssignOrder}
                disabled={!selectedStoreId || isAssigning}
                className="min-w-[120px]"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التعيين...
                  </>
                ) : (
                  'تعيين الطلب'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* المتجر المسند */}
      {assignedStore && (
        <Card>
          <CardHeader>
            <CardTitle>المتجر المسند</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-lg">{assignedStore.name}</p>
                <p className="text-gray-600">ID: {assignedStore.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;
