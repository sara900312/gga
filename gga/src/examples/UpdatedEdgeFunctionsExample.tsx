/**
 * Updated Edge Functions Example using supabase.functions.invoke()
 * WITHOUT Authorization headers - demonstrates the new requirements
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getOrderDetails, 
  assignOrderToStore, 
  autoAssignAllOrders,
  formatOrderForDisplay,
  handleEdgeFunctionError,
  type OrderData,
  type AutoAssignResponse 
} from '@/utils/edgeFunctionHelpers';
import { 
  Package, Eye, UserCheck, Zap, RefreshCw, Loader2,
  Clock, CheckCircle, XCircle, AlertCircle, User, Phone,
  MapPin, Calendar, DollarSign, Store
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface Store {
  id: string;
  name: string;
}

interface OrderWithProduct {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  order_status: string;
  order_code: string;
  total_amount: number;
  main_store_name: string;
  assigned_store_name?: string;
  assigned_store_id?: string;
  created_at: string;
}

const UpdatedEdgeFunctionsExample: React.FC = () => {
  // State management
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedOrderData, setSelectedOrderData] = useState<OrderData | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [assignmentSummary, setAssignmentSummary] = useState<AutoAssignResponse | null>(null);
  
  // Loading states
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  
  // Dialog states
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAssignmentSummary, setShowAssignmentSummary] = useState(false);
  
  const { toast } = useToast();

  // Fetch orders using existing RPC function
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase.rpc("get_orders_with_products");
      if (error) throw error;
      setOrders(data || []);
      console.log("✅ Orders fetched:", data?.length || 0);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      toast({
        title: "خطأ في تحميل الطلبات",
        description: handleEdgeFunctionError(error, "fetchOrders"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch stores
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      setStores(data || []);
      console.log("✅ Stores fetched:", data?.length || 0);
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
      toast({
        title: "خطأ في تحميل المتاجر",
        description: handleEdgeFunctionError(error, "fetchStores"),
        variant: "destructive",
      });
    }
  };

  // 1. VIEW ORDER DETAILS - Using get-order Edge Function
  const handleViewOrderDetails = async (orderId: string) => {
    setIsLoadingOrderDetails(true);
    setSelectedOrderId(orderId);
    setShowOrderDetails(true);
    
    const result = await getOrderDetails(orderId);
    
    if (result.success && result.order) {
      setSelectedOrderData(result.order);
      console.log("✅ Order details loaded:", result.order);
      toast({
        title: "تم تحميل التفاصيل",
        description: "تم تحميل تفاصيل الطلب بنجاح",
      });
    } else {
      console.error("❌ Error loading order details:", result.error);
      toast({
        title: "خطأ في تحميل التفاصيل",
        description: result.error || "فشل في تحميل تفاصيل الطلب",
        variant: "destructive",
      });
      setShowOrderDetails(false);
    }
    
    setIsLoadingOrderDetails(false);
  };

  // 2. ASSIGN ORDER - Using assign-order Edge Function
  const handleAssignOrder = async (orderId: string, storeId: string) => {
    setIsAssigning(true);
    
    const result = await assignOrderToStore(orderId, storeId);
    
    if (result.success) {
      console.log("✅ Order assigned successfully:", result);
      toast({
        title: "تم التعيين بنجاح",
        description: result.message || "تم تعيين الطلب للمتجر بنجاح",
      });
      
      // Refresh orders list and order details if viewing
      await fetchOrders();
      if (selectedOrderId === orderId) {
        await handleViewOrderDetails(orderId);
      }
      
      // Reset selection
      setSelectedStoreId('');
    } else {
      console.error("❌ Error assigning order:", result.error);
      toast({
        title: "خطأ في التعيين",
        description: result.error || "فشل في تعيين الطلب",
        variant: "destructive",
      });
    }
    
    setIsAssigning(false);
  };

  // 3. AUTO-ASSIGN ORDERS - Using auto-assign-orders Edge Function
  const handleAutoAssignOrders = async () => {
    setIsAutoAssigning(true);
    
    const result = await autoAssignAllOrders();
    
    if (result.success) {
      console.log("✅ Auto-assignment completed:", result);
      setAssignmentSummary(result);
      setShowAssignmentSummary(true);
      
      toast({
        title: "تم التعيين التلقائي",
        description: result.message || `تم تعيين ${result.assigned_count} طلب بنجاح`,
      });
      
      // Refresh orders list
      await fetchOrders();
    } else {
      console.error("❌ Error in auto-assignment:", result.error);
      toast({
        title: "خطأ في التعيين التلقائي",
        description: result.error || "فشل في التعيين التلقائي",
        variant: "destructive",
      });
    }
    
    setIsAutoAssigning(false);
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلقة', variant: 'secondary' as const, icon: Clock },
      assigned: { label: 'معينة', variant: 'default' as const, icon: Package },
      delivered: { label: 'مسلمة', variant: 'default' as const, icon: CheckCircle },
      completed: { label: 'مسلمة', variant: 'default' as const, icon: CheckCircle },
      returned: { label: 'مرتجعة', variant: 'destructive' as const, icon: XCircle },
    };
    
    return statusConfig[status as keyof typeof statusConfig] || 
           { label: status, variant: 'secondary' as const, icon: AlertCircle };
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.order_status === status);
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(order => order.order_status === 'pending').length,
      assigned: orders.filter(order => order.order_status === 'assigned').length,
      delivered: orders.filter(order => order.order_status === 'delivered').length,
      returned: orders.filter(order => order.order_status === 'returned').length,
    };
  };

  // Load initial data
  useEffect(() => {
    fetchOrders();
    fetchStores();
  }, []);

  const stats = getOrderStats();

  // Render assignment summary
  const renderAssignmentSummary = () => {
    if (!assignmentSummary) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{assignmentSummary.assigned_count}</div>
              <div className="text-sm text-muted-foreground">طلبات تم تعيينها</div>
            </CardContent>
          </Card>
          
          {assignmentSummary.unmatched_count !== undefined && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{assignmentSummary.unmatched_count}</div>
                <div className="text-sm text-muted-foreground">طلبات غير مطابقة</div>
              </CardContent>
            </Card>
          )}
          
          {assignmentSummary.error_count !== undefined && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{assignmentSummary.error_count}</div>
                <div className="text-sm text-muted-foreground">أخطاء</div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {assignmentSummary.errors && assignmentSummary.errors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">الأخطاء التي حدثت:</div>
              <ul className="list-disc list-inside space-y-1">
                {assignmentSummary.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              تكامل Edge Functions المحدث - بدون Authorization Headers
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={fetchOrders}
                disabled={isLoadingOrders}
                variant="outline"
                size="sm"
              >
                {isLoadingOrders ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 ml-2" />
                )}
                تحديث الطلبات
              </Button>
              
              <Button
                onClick={handleAutoAssignOrders}
                disabled={isAutoAssigning || stats.pending === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isAutoAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري التعيين التلقائي...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 ml-2" />
                    تعيين تلقائي ({stats.pending} طلب معلق)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>التحديث الجديد:</strong> يستخدم الآن <code>supabase.functions.invoke()</code> بدلاً من <code>fetch()</code>
              <br />
              <strong>مهم:</strong> لا يتم إرسال أي Authorization headers أو JWT tokens
              <br />
              • <strong>get-order:</strong> جلب تفاصيل الطلب الكاملة
              <br />
              • <strong>assign-order:</strong> تعيين الطلب لمتجر معين
              <br />
              • <strong>auto-assign-orders:</strong> التعيين التلقائي للطلبات المعلقة
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">إجمالي الطلبات</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">طلبات معلقة</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <div className="text-sm text-muted-foreground">طلبات معينة</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">طلبات مسلمة</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.returned}</div>
            <div className="text-sm text-muted-foreground">طلبات مرتجعة</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">معلقة ({stats.pending})</TabsTrigger>
              <TabsTrigger value="assigned">معينة ({stats.assigned})</TabsTrigger>
              <TabsTrigger value="delivered">مسلمة ({stats.delivered})</TabsTrigger>
              <TabsTrigger value="returned">مرتجعة ({stats.returned})</TabsTrigger>
            </TabsList>

            {['pending', 'assigned', 'delivered', 'returned'].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {isLoadingOrders ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin ml-2" />
                    جاري تحميل الطلبات...
                  </div>
                ) : getOrdersByStatus(status).length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    لا توجد طلبات {getStatusBadge(status).label}
                  </div>
                ) : (
                  getOrdersByStatus(status).map((order) => {
                    const statusInfo = getStatusBadge(order.order_status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold">
                                طلب #{order.order_code || order.order_id.slice(0, 8)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {order.customer_name}
                              </p>
                            </div>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrderDetails(order.order_id)}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              تفاصيل
                            </Button>
                            
                            {order.order_status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={selectedStoreId}
                                  onValueChange={setSelectedStoreId}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="اختر متجر" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stores.map((store) => (
                                      <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleAssignOrder(order.order_id, selectedStoreId)}
                                  disabled={!selectedStoreId || isAssigning}
                                >
                                  {isAssigning ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">المبلغ: </span>
                            <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
                          </div>
                          <div>
                            <span className="font-medium">المتجر الرئيسي: </span>
                            <span>{order.main_store_name}</span>
                          </div>
                        </div>
                        
                        {order.assigned_store_name && (
                          <div className="text-sm">
                            <span className="font-medium">المتجر المعين: </span>
                            <span className="text-blue-600">{order.assigned_store_name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب - تم جلبها باستخدام get-order Edge Function</DialogTitle>
          </DialogHeader>
          
          {isLoadingOrderDetails ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin ml-2" />
              جاري تحميل تفاصيل الطلب باستخدام Edge Function...
            </div>
          ) : selectedOrderData ? (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold">
                    طلب #{selectedOrderData.order_code}
                  </h3>
                  <p className="text-muted-foreground">
                    {formatOrderForDisplay(selectedOrderData).orderInfo.createdAt}
                  </p>
                </div>
                <Badge variant={getStatusBadge(selectedOrderData.order_status).variant}>
                  {getStatusBadge(selectedOrderData.order_status).label}
                </Badge>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold border-b pb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    معلومات العميل
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <strong>الاسم:</strong> {selectedOrderData.customer_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <strong>الهاتف:</strong> {selectedOrderData.customer_phone}
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                      <div>
                        <strong>العنوان:</strong>
                        <br />
                        {selectedOrderData.customer_address}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <strong>الملاحظات:</strong>
                      <span>{selectedOrderData.customer_notes || 'لا توجد'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold border-b pb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    تفاصيل الطلب
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <strong>المبلغ الإجمالي:</strong> {formatCurrency(selectedOrderData.total_amount)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-purple-600" />
                      <strong>المتجر الرئيسي:</strong> {selectedOrderData.main_store_name}
                    </div>
                    {selectedOrderData.assigned_store_name && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <strong>المتجر المعين:</strong> {selectedOrderData.assigned_store_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrderData.items && selectedOrderData.items.length > 0 && (
                <div>
                  <h4 className="font-semibold border-b pb-2 mb-3">
                    عناصر الطلب ({selectedOrderData.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            المتجر الرئيسي: {item.main_store} | الكمية: {item.quantity}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(item.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            المجموع: {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Section for Pending Orders */}
              {selectedOrderData.order_status === 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">تعيين الطلب باستخدام assign-order Edge Function</h4>
                  <div className="flex gap-3">
                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                      <SelectTrigger className="flex-1">
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
                    
                    <Button
                      onClick={() => handleAssignOrder(selectedOrderData.order_id, selectedStoreId)}
                      disabled={!selectedStoreId || isAssigning}
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري التعيين...
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 ml-2" />
                          تعيين الطلب
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              لم يتم العثور على بيانات الطلب
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Summary Dialog */}
      <Dialog open={showAssignmentSummary} onOpenChange={setShowAssignmentSummary}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>نتائج التعيين التلقائي - auto-assign-orders Edge Function</DialogTitle>
          </DialogHeader>
          {renderAssignmentSummary()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdatedEdgeFunctionsExample;
