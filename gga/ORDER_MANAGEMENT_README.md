# نظام إدارة الطلبات - Order Management System

## نظرة عامة

هذا الدليل يشرح كيفية استخدام نظام إدارة الطلبات المطور باستخدام React و Supabase. النظام يتيح تعيين الطلبات للمتاجر وتحديث حالتها مع إعادة تحميل البيانات تلقائياً.

## المكونات الرئيسية

### 1. Hook للطلبات - `useOrders`

```typescript
import { useOrders } from "@/hooks/useOrders";

const {
  orders, // قائمة الطلبات
  orderStats, // إحصائيات الطلبات
  isLoading, // حالة التحميل
  error, // رسائل الخطأ
  refreshOrders, // إعادة تحميل البيانات
  fetchOrderById, // جلب طلب واحد
  fetchOrdersByStatus, // جلب الطلبات حسب الحالة
} = useOrders({
  autoFetch: true, // جلب البيانات تلقائياً
  storeId: null, // تصفية حسب المتجر
});
```

### 2. Hook لتعيين الطلبات - `useOrderAssignment`

```typescript
import { useOrderAssignment } from "@/hooks/useOrderAssignment";

const {
  assignOrderToStore, // تعيين طلب لمتجر (استخدام Edge Function)
  assignOrderWithStatus, // تعيين طلب مع تحديث الحالة
  updateOrderStatus, // تحديث حالة الطلب
  markOrderAsDelivered, // تحديث إلى مسلم
  markOrderAsReturned, // تحديث إلى مرتجع
  unassignOrder, // إلغاء تعيين الطلب
  isLoading, // حالة التحميل
} = useOrderAssignment({
  onSuccess: () => {
    // دالة يتم استدعاؤها عند نجاح العملية
    refreshOrders();
  },
  onError: (error) => {
    // دالة يتم استدعاؤها عند حدوث خطأ
    console.error(error);
  },
});
```

### 3. مكون إدارة التعيين - `OrderAssignmentButton`

```jsx
import OrderAssignmentButton from "@/components/OrderAssignmentButton";

<OrderAssignmentButton
  orderId={order.order_id}
  currentStoreId={order.assigned_store_id}
  currentStatus={order.order_status}
  stores={stores}
  onAssignmentChange={refreshOrders}
  variant="select" // أو "button" أو "badge"
/>;
```

## أمثلة الاستخدام

### مثال بسيط - تعيين طلب لمتجر

```jsx
import React from "react";
import { useOrderAssignment } from "@/hooks/useOrderAssignment";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";

const SimpleOrderAssignment = () => {
  const { orders, refreshOrders } = useOrders();
  const { assignOrderWithStatus, isLoading } = useOrderAssignment({
    onSuccess: refreshOrders,
  });

  const handleAssign = async (orderId, storeId) => {
    const result = await assignOrderWithStatus(orderId, storeId);
    if (result.success) {
      console.log("تم تعيين الطلب بنجاح");
    }
  };

  return (
    <div>
      {orders.map((order) => (
        <div key={order.order_id}>
          <h3>{order.customer_name}</h3>
          <Button
            onClick={() => handleAssign(order.order_id, "store-id")}
            disabled={isLoading}
          >
            تعيين للمتجر
          </Button>
        </div>
      ))}
    </div>
  );
};
```

### مثال متقدم - إدارة شاملة للطلبات

```jsx
import React from "react";
import { useOrders } from "@/hooks/useOrders";
import { useOrderAssignment } from "@/hooks/useOrderAssignment";
import OrderAssignmentButton from "@/components/OrderAssignmentButton";

const AdvancedOrderManagement = () => {
  const { orders, orderStats, isLoading, refreshOrders } = useOrders();
  const { assignOrderWithStatus, markOrderAsDelivered, markOrderAsReturned } =
    useOrderAssignment({
      onSuccess: refreshOrders,
    });

  const stores = [
    { id: "1", name: "متجر الرياض" },
    { id: "2", name: "متجر جدة" },
  ];

  return (
    <div>
      {/* إحصائيات */}
      <div>
        <h2>الإحصائيات</h2>
        <p>إجمالي الطلبات: {orderStats.total}</p>
        <p>في الانتظار: {orderStats.pending}</p>
        <p>معينة: {orderStats.assigned}</p>
        <p>مسلمة: {orderStats.delivered}</p>
      </div>

      {/* قائمة الطلبات */}
      <div>
        {orders.map((order) => (
          <div key={order.order_id}>
            <h3>{order.customer_name}</h3>
            <p>{order.customer_phone}</p>

            {/* مكون إدارة التعيين */}
            <OrderAssignmentButton
              orderId={order.order_id}
              currentStoreId={order.assigned_store_id}
              currentStatus={order.order_status}
              stores={stores}
              onAssignmentChange={refreshOrders}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## العمليات المتاحة

### 1. تعيين طلب لمتجر

```javascript
// الطريقة الأولى: استخدام Edge Function
await assignOrderToStore(orderId, storeId);

// الطريقة الثانية: تحديث مباشر مع الحالة
await assignOrderWithStatus(orderId, storeId);
```

### 2. تحديث حالة الطلب

```javascript
// تحديث عام للحالة
await updateOrderStatus(orderId, {
  assigned_store_id: storeId,
  order_status: "assigned",
  status: "assigned",
});

// تحديث محدد للحالات
await markOrderAsDelivered(orderId); // مسلم
await markOrderAsReturned(orderId); // مرتجع
await unassignOrder(orderId); // إلغاء التعيين
```

### 3. جلب البيانات

```javascript
// جلب جميع الطلبات
await fetchOrders();

// جلب طلب واحد
await fetchOrderById(orderId);

// جلب الطلبات حسب الحالة
await fetchOrdersByStatus("assigned");
```

## استعلامات SQL

### تحديث حالة الطلب وتعيينه لمتجر

```sql
UPDATE orders
SET
    assigned_store_id = $1,
    order_status = 'assigned',
    status = 'assigned',
    updated_at = NOW()
WHERE
    id = $2;
```

### جلب الطلبات مع تفاصيل المتاجر

```sql
SELECT
    o.*,
    s.name as store_name
FROM orders o
LEFT JOIN stores s ON o.assigned_store_id = s.id
ORDER BY o.created_at DESC;
```

### إحصائيات الطلبات

```sql
SELECT
    COUNT(*) as total_orders,
    COUNT(CASE WHEN order_status = 'pending' OR order_status IS NULL THEN 1 END) as pending_orders,
    COUNT(CASE WHEN order_status = 'assigned' THEN 1 END) as assigned_orders,
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN order_status = 'returned' THEN 1 END) as returned_orders
FROM orders;
```

## حالات الطلبات

| الحالة    | الوصف       | الرمز       |
| --------- | ----------- | ----------- |
| pending   | في الانتظار | `pending`   |
| assigned  | معين لمتجر  | `assigned`  |
| delivered | مسلم        | `delivered` |
| returned  | مرتجع       | `returned`  |

## معالجة الأخطاء

```javascript
const { assignOrderWithStatus } = useOrderAssignment({
  onSuccess: () => {
    console.log("تم بنجاح");
    refreshOrders();
  },
  onError: (error) => {
    console.error("حدث خطأ:", error);
    // عرض رسالة خطأ للمستخدم
  },
});

// أو معالجة الأخطاء مباشرة
const result = await assignOrderWithStatus(orderId, storeId);
if (!result.success) {
  console.error("فشل في التعيين:", result.error);
}
```

## التحديث التلقائي للبيانات

النظام يتضمن آلية لإعادة تحميل البيانات تلقائياً:

1. **عند نجاح العمليات**: يتم استدعاء `onSuccess` callback
2. **الاشتراك في الوقت الفعلي**: Hook `useOrders` يراقب تغييرات قاعدة البيانات
3. **إعادة التحميل اليدوي**: استخدام `refreshOrders()`

## التخصيص

### تخصيص أنواع العرض

```jsx
{
  /* عرض Select للتعيين */
}
<OrderAssignmentButton variant="select" />;

{
  /* عرض Button بسيط */
}
<OrderAssignmentButton variant="button" />;

{
  /* عرض Badge للحالة فقط */
}
<OrderAssignmentButton variant="badge" />;
```

### فلترة البيانات

```javascript
// جلب طلب��ت متجر معين
const { orders } = useOrders({ storeId: "store-123" });

// فلترة يدوية
const pendingOrders = orders.filter(
  (order) => order.order_status === "pending",
);
```

## الملفات المرجعية

- `src/hooks/useOrders.ts` - Hook إدارة الطلبات
- `src/hooks/useOrderAssignment.ts` - Hook تعيين الطلبات
- `src/components/OrderAssignmentButton.tsx` - مكون التعيين
- `src/components/OrderManagementExample.tsx` - مثال شامل
- `src/examples/OrderManagementUsage.tsx` - مثال بسيط
- `sql-queries.sql` - استعلامات SQL

## المتطلبات

- React 18+
- Supabase Client
- TypeScript
- UI Components (shadcn/ui)

## الدعم

لأي استفسارات أو مشاكل، يرجى مراجعة الأمثلة المرفقة أو التواصل مع فريق التطوير.
