import React from "react";
import { Button } from "@/components/ui/button";
import { useOrderAssignment } from "@/hooks/useOrderAssignment";
import { useOrders } from "@/hooks/useOrders";
import OrderAssignmentButton from "@/components/OrderAssignmentButton";
import { useToast } from "@/hooks/use-toast";

/**
 * مثال بسيط لاستخدام نظام إدارة الطلبات
 * Simple example of using the order management system
 */
const OrderManagementUsage: React.FC = () => {
  const { toast } = useToast();

  // 1. استخدام هوك جلب الطلبات
  // Using the orders hook
  const { orders, isLoading, refreshOrders, orderStats } = useOrders();

  // 2. استخدام هوك تعيين الطلبات
  // Using the order assignment hook
  const {
    assignOrderWithStatus,
    markOrderAsDelivered,
    markOrderAsReturned,
    isLoading: isAssigning,
  } = useOrderAssignment({
    onSuccess: () => {
      // إعادة تحميل البيانات عند نجاح العملية
      refreshOrders();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الطلب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error,
        variant: "destructive",
      });
    },
  });

  // مثال على متاجر وهمية
  const sampleStores = [
    {
      id: "1",
      name: "متجر الرياض",
      password: "",
      created_at: "",
      updated_at: "",
    },
    { id: "2", name: "متجر جدة", password: "", created_at: "", updated_at: "" },
  ];

  // 3. دالة لتعيين طلب لمتجر معين
  const handleAssignOrder = async (orderId: string, storeId: string) => {
    const result = await assignOrderWithStatus(orderId, storeId);
    console.log("نتيجة التعيين:", result);
  };

  // 4. دالة لتحديث حالة الطلب إلى مسلم
  const handleMarkDelivered = async (orderId: string) => {
    const result = await markOrderAsDelivered(orderId);
    console.log("نتيجة التسليم:", result);
  };

  // 5. دالة لتحديث حالة الطلب إلى مرتجع
  const handleMarkReturned = async (orderId: string) => {
    const result = await markOrderAsReturned(orderId);
    console.log("نتيجة الإرجاع:", result);
  };

  if (isLoading) {
    return <div>جاري تحميل الطلبات...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        مثال على استخدام نظام إدارة الطلبات
      </h1>

      {/* إحصائيات سريعة */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">إحصائيات الطلبات:</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="font-bold text-xl">{orderStats.total}</div>
            <div className="text-sm text-gray-600">إجمالي</div>
          </div>
          <div>
            <div className="font-bold text-xl text-yellow-600">
              {orderStats.pending}
            </div>
            <div className="text-sm text-gray-600">معلقة</div>
          </div>
          <div>
            <div className="font-bold text-xl text-blue-600">
              {orderStats.assigned}
            </div>
            <div className="text-sm text-gray-600">معينة</div>
          </div>
          <div>
            <div className="font-bold text-xl text-green-600">
              {orderStats.delivered}
            </div>
            <div className="text-sm text-gray-600">مسلمة</div>
          </div>
        </div>
      </div>

      {/* زر إعادة التحميل */}
      <Button onClick={refreshOrders} disabled={isLoading}>
        إعادة تحميل الطلبات
      </Button>

      {/* قائمة الطلبات */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">الطلبات ({orders.length})</h3>

        {orders.slice(0, 5).map((order) => (
          <div key={order.order_id} className="border p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{order.customer_name}</h4>
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
                <p className="text-sm">{order.order_code}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{order.total_amount} ريال</p>
                <p className="text-sm text-gray-600">{order.product_name}</p>
              </div>
            </div>

            {/* مكون إدارة التعيين */}
            <OrderAssignmentButton
              orderId={order.order_id}
              currentStoreId={order.assigned_store_id}
              currentStatus={order.order_status}
              stores={sampleStores}
              onAssignmentChange={refreshOrders}
              variant="select"
            />

            {/* أزرار إضافية للمثال */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAssignOrder(order.order_id, "1")}
                disabled={isAssigning}
              >
                تعيين لمتجر الرياض
              </Button>

              {order.order_status === "assigned" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkDelivered(order.order_id)}
                    disabled={isAssigning}
                    className="text-green-600"
                  >
                    تسليم
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkReturned(order.order_id)}
                    disabled={isAssigning}
                    className="text-red-600"
                  >
                    إرجاع
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* مثال على الاستخدام المبسط */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">كود المثال:</h4>
        <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
          {`// 1. استيراد الهوكس
import { useOrders } from '@/hooks/useOrders';
import { useOrderAssignment } from '@/hooks/useOrderAssignment';

// 2. استخدام الهوكس في الكومبوننت
const { orders, refreshOrders } = useOrders();
const { assignOrderWithStatus } = useOrderAssignment({
  onSuccess: () => refreshOrders()
});

// 3. تعيين طلب لمتجر
await assignOrderWithStatus(orderId, storeId);`}
        </pre>
      </div>
    </div>
  );
};

export default OrderManagementUsage;
