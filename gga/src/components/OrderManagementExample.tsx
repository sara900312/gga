import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { useOrderAssignment } from "@/hooks/useOrderAssignment";
import OrderAssignmentButton from "@/components/OrderAssignmentButton";
import { Loader2, RefreshCw, Search, Package2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatCurrency } from "@/utils/currency";

type Store = Tables<"stores">;

// بيانات تجريبية للمتاجر (يجب جلبها من قاعدة البيانات)
const SAMPLE_STORES: Store[] = [
  {
    id: "1",
    name: "متجر الرياض",
    password: "",
    created_at: "",
    updated_at: "",
  },
  { id: "2", name: "متجر جدة", password: "", created_at: "", updated_at: "" },
  {
    id: "3",
    name: "متجر الدمام",
    password: "",
    created_at: "",
    updated_at: "",
  },
];

const OrderManagementExample: React.FC = () => {
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // استخدام هوك إدارة الطلبات
  const {
    orders,
    orderStats,
    isLoading: ordersLoading,
    error,
    refreshOrders,
    fetchOrdersByStatus,
  } = useOrders({
    autoFetch: true,
    storeId: selectedStoreFilter || null,
  });

  // استخدام هوك تعيين الطلبات
  const {
    assignOrderWithStatus,
    updateOrderStatus,
    isLoading: assignmentLoading,
  } = useOrderAssignment({
    onSuccess: () => {
      // إعادة تحميل البيانات بعد نجاح العملية
      refreshOrders();
    },
  });

  // فلترة الطلبات حسب البحث
  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // معالج تعيين طلب لمتجر مع تحديث الحالة
  const handleQuickAssign = async (orderId: string, storeId: string) => {
    const result = await assignOrderWithStatus(orderId, storeId);
    if (result.success) {
      console.log("تم تعيين الطلب بنجاح:", result.data);
    }
  };

  // معالج تحديث حالة طلب
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, {
      order_status: newStatus,
      status: newStatus,
    });
    if (result.success) {
      console.log("تم تحديث حالة الطلب:", result.data);
    }
  };

  // معالج جلب طلبات حسب الحالة
  const handleFilterByStatus = async (status: string) => {
    const result = await fetchOrdersByStatus(status);
    if (result.success) {
      console.log(`طلبات بحالة ${status}:`, result.data);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* إحصائيات الطلبات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                إجمالي الطلبات
              </p>
              <p className="text-2xl font-bold">{orderStats.total}</p>
            </div>
            <Package2 className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                في الانتظار
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {orderStats.pending}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              {orderStats.pending}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">معينة</p>
              <p className="text-2xl font-bold text-blue-600">
                {orderStats.assigned}
              </p>
            </div>
            <Badge variant="default">{orderStats.assigned}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">مسلمة</p>
              <p className="text-2xl font-bold text-green-600">
                {orderStats.delivered}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {orderStats.delivered}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم والفلترة */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الطلبات</CardTitle>
          <CardDescription>تعيين الطلبات للمتاجر وتحديث حالتها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1">
              <Label htmlFor="search">البحث في الطلبات</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="اسم العميل، رقم الهاتف، أو رمز الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* إعادة تحميل */}
            <div className="flex items-end">
              <Button
                onClick={refreshOrders}
                disabled={ordersLoading}
                variant="outline"
              >
                {ordersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                تحديث
              </Button>
            </div>
          </div>

          {/* أزرار فلترة سريعة حسب الحالة */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterByStatus("pending")}
            >
              الطلبات المعلقة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterByStatus("assigned")}
            >
              الطلبات المعينة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterByStatus("delivered")}
            >
              الطلبات المسلمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mr-2">جاري تحميل الطلبات...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات للعرض
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.order_id}
                  className="border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                      {/* معلومات الطلب */}
                      <div>
                        <h4 className="font-semibold text-lg">
                          {order.customer_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_phone}
                        </p>
                        <p className="text-sm">{order.customer_city}</p>
                        <Badge variant="outline" className="mt-1">
                          {order.order_code}
                        </Badge>
                      </div>

                      {/* تفاصيل المنتج */}
                      <div>
                        <p className="font-medium">{order.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(
                            "ar-SA",
                          )}
                        </p>
                      </div>

                      {/* ��دارة التعيين */}
                      <div>
                        <OrderAssignmentButton
                          orderId={order.order_id}
                          currentStoreId={order.assigned_store_id}
                          currentStatus={order.order_status}
                          stores={SAMPLE_STORES}
                          onAssignmentChange={refreshOrders}
                          variant="select"
                        />
                      </div>

                      {/* أزرار إضافية */}
                      <div className="flex flex-col gap-2">
                        {!order.assigned_store_id && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              تعيين سريع:
                            </p>
                            {SAMPLE_STORES.slice(0, 2).map((store) => (
                              <Button
                                key={store.id}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleQuickAssign(order.order_id, store.id)
                                }
                                disabled={assignmentLoading}
                                className="w-full text-xs"
                              >
                                {store.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagementExample;
