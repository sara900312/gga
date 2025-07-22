import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAssignOrder } from "@/hooks/useAssignOrder";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Store,
} from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_code?: string;
  order_status?: string;
  assigned_store_id?: string;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
}

/**
 * مكون كامل لتعيين الطلبات للمتاجر
 * يدعم تعيين طلب واحد أو طلبات متعددة
 */
const OrderAssignmentForm: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [manualOrderId, setManualOrderId] = useState<string>("");
  const [manualStoreId, setManualStoreId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [mode, setMode] = useState<"dropdown" | "manual">("dropdown");

  const { assignOrder, isLoading, error, lastResponse } = useAssignOrder();

  // جلب الطلبات والمتاجر عند تحميل المكون
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // جلب الطلبات
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_phone, order_code, order_status, assigned_store_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;

      // جلب المتاجر
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("id, name")
        .order("name");

      if (storesError) throw storesError;

      setOrders(ordersData || []);
      setStores(storesData || []);

      console.log("✅ تم جلب البيانات:", {
        orders: ordersData?.length || 0,
        stores: storesData?.length || 0,
      });
    } catch (error) {
      console.error("❌ خطأ في جلب البيانات:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // تعيين طلب باستخدام القائمة المنسدلة
  const handleDropdownAssignment = async () => {
    if (!selectedOrderId || !selectedStoreId) {
      alert("يرجى اختيار طلب ومتجر");
      return;
    }

    const result = await assignOrder(selectedOrderId, selectedStoreId);

    if (result.success) {
      // إعادة تحميل البيانات عند النجاح
      setTimeout(fetchData, 1000);

      // مسح الاختيارات
      setSelectedOrderId("");
      setSelectedStoreId("");
    }
  };

  // تعيين طلب باستخدام الإدخال اليدوي
  const handleManualAssignment = async () => {
    if (!manualOrderId.trim() || !manualStoreId.trim()) {
      alert("يرجى إدخال معرف الطلب ومعرف المتجر");
      return;
    }

    const result = await assignOrder(
      manualOrderId.trim(),
      manualStoreId.trim(),
    );

    if (result.success) {
      // إعادة تحميل البيانات عند النجاح
      setTimeout(fetchData, 1000);

      // مسح المدخلات
      setManualOrderId("");
      setManualStoreId("");
    }
  };

  // الحصول على اسم المتجر من المعرف
  const getStoreName = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    return store?.name || "غير محدد";
  };

  // فلترة الطلبات غير المعينة
  const unassignedOrders = orders.filter((order) => !order.assigned_store_id);

  return (
    <div className="space-y-6" dir="rtl">
      {/* نتيجة آخر عملية */}
      {lastResponse && (
        <Alert
          className={
            lastResponse.success
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50"
          }
        >
          {lastResponse.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={lastResponse.success ? "text-green-800" : "text-red-800"}
          >
            {lastResponse.success ? lastResponse.message : lastResponse.error}
          </AlertDescription>
        </Alert>
      )}

      {/* خطأ عام */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* أزرار التبديل بين الأنماط */}
      <div className="flex gap-2">
        <Button
          variant={mode === "dropdown" ? "default" : "outline"}
          onClick={() => setMode("dropdown")}
          size="sm"
        >
          📋 اختيار من القائمة
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          size="sm"
        >
          ✏️ إدخال يدوي
        </Button>
      </div>

      {loadingData ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin ml-2" />
            <span>جاري تحميل البيانات...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* نمط القائمة المنسدلة */}
          {mode === "dropdown" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  تعيين طلب من القائمة
                </CardTitle>
                <CardDescription>
                  اختر طلب ومتجر من القوائم المنسدلة لتعيين الطلب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* اختيار الطلب */}
                <div className="space-y-2">
                  <Label htmlFor="order-select">
                    اختر الطلب ({unassignedOrders.length} طلب غير معين)
                  </Label>
                  <Select
                    value={selectedOrderId}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طلب..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{order.customer_name}</span>
                            <span className="text-sm text-gray-500 mr-2">
                              {order.customer_phone}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* اختيار المتجر */}
                <div className="space-y-2">
                  <Label htmlFor="store-select">
                    اختر المتجر ({stores.length} متجر متاح)
                  </Label>
                  <Select
                    value={selectedStoreId}
                    onValueChange={setSelectedStoreId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر متجر..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {store.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* زر التعيين */}
                <Button
                  onClick={handleDropdownAssignment}
                  disabled={!selectedOrderId || !selectedStoreId || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري التعيين...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تعيين الطلب
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* نمط الإدخال اليدوي */}
          {mode === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✏️ تعيين طلب بالمعرف
                </CardTitle>
                <CardDescription>
                  أدخل معرف الطلب ومعرف المتجر مباشرة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* معرف الطلب */}
                <div className="space-y-2">
                  <Label htmlFor="manual-order-id">معرف الطلب (Order ID)</Label>
                  <Input
                    id="manual-order-id"
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    placeholder="أدخل معرف الطلب..."
                    dir="ltr"
                  />
                </div>

                {/* معرف المتجر */}
                <div className="space-y-2">
                  <Label htmlFor="manual-store-id">
                    معرف المتجر (Store ID)
                  </Label>
                  <Input
                    id="manual-store-id"
                    value={manualStoreId}
                    onChange={(e) => setManualStoreId(e.target.value)}
                    placeholder="أدخل معرف المتجر..."
                    dir="ltr"
                  />
                </div>

                {/* زر التعيين */}
                <Button
                  onClick={handleManualAssignment}
                  disabled={
                    !manualOrderId.trim() || !manualStoreId.trim() || isLoading
                  }
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري التعيين...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تعيين الطلب
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* معلومات إضافية */}
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {orders.length}
                  </div>
                  <div className="text-sm text-blue-800">إجمالي الطلبات</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {unassignedOrders.length}
                  </div>
                  <div className="text-sm text-yellow-800">غير معينة</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {orders.length - unassignedOrders.length}
                  </div>
                  <div className="text-sm text-green-800">معينة</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stores.length}
                  </div>
                  <div className="text-sm text-purple-800">متاجر متاحة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* قائمة الطلبات الحديثة */}
          <Card>
            <CardHeader>
              <CardTitle>آخر الطلبات</CardTitle>
              <CardDescription>
                عرض آخر 10 طلبات مع حالة التعيين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer_phone}
                      </div>
                    </div>
                    <div className="text-left">
                      {order.assigned_store_id ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          {getStoreName(order.assigned_store_id)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">غير معين</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrderAssignmentForm;
