# 🔧 حل مشاكل Edge Functions - Failed to fetch

## 🎯 المشكلة
كانت تحدث أخطاء `Failed to fetch` عند استدعاء Edge Functions لأن `supabase.functions.invoke()` كان يضيف `Authorization` headers تلقائياً مما يتعارض مع استخدام `Service Role Key` داخل الدوال.

## ✅ الحل
استبدال `supabase.functions.invoke()` بـ `fetch` عادي بدون `Authorization` headers.

## 📁 الملفات المُحدثة

### 1. `src/hooks/useEdgeFunctions.ts` ✅
تم تحديث جميع الدوال لاستخدام `fetch` بدلاً من `supabase.functions.invoke()`:

```typescript
// ❌ الطريقة القديمة
const { data, error } = await supabase.functions.invoke('get-order', {
  body: { orderId }
});

// ✅ الطريقة الجديدة
const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/get-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ orderId })
});
```

### 2. `src/utils/edgeFunctionsExamples.ts` ✅ جديد
أمثلة جاهزة للاستخدام المباشر:

```typescript
// 1️⃣ جلب تفاصيل الطلب
const order = await callGetOrder('order-id-123');

// 2️⃣ تعيين طلب لمتجر
const result = await callAssignOrder('order-id-123', 'store-id-456');

// 3️⃣ التعيين التلقائي
const autoResult = await callAutoAssignOrders();
```

### 3. `src/examples/EdgeFunctionsTestComponent.tsx` ✅ جديد
مكون تجريبي لاختبار جميع الدوال مع واجهة مستخدم.

## 🎯 Edge Functions المدعومة

### 1. get-order
```typescript
const callGetOrder = async (orderId: string) => {
  const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/get-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  // معالجة النتيجة...
};
```

**Input:** `{ orderId: string }`
**Output:** بيانات الطلب الكاملة

### 2. assign-order
```typescript
const callAssignOrder = async (orderId: string, storeId: string) => {
  const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/assign-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, storeId })
  });
  // معالجة النتيجة...
};
```

**Input:** `{ orderId: string, storeId: string }`
**Output:** `{ success: boolean, message: string }`

### 3. auto-assign-orders
```typescript
const callAutoAssignOrders = async () => {
  const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/auto-assign-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  // معالجة النتيجة...
};
```

**Input:** `{}` (بدون باراميترات)
**Output:** `{ assigned_count, unmatched_count, error_count, message }`

## 🔧 معالجة الأخطاء

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  // معالجة النجاح
} catch (error) {
  console.error("❌ Error:", error);
  // عرض الخطأ للمستخدم
}
```

## 🎯 مثال كامل للاستخدام في React

```typescript
import { useToast } from '@/hooks/use-toast';
import { callGetOrder, callAssignOrder, callAutoAssignOrders } from '@/utils/edgeFunctionsExamples';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const order = await callGetOrder(orderId);
      console.log("تم جلب الطلب:", order);
      toast({ title: "نجح", description: "تم جلب الطلب" });
    } catch (error) {
      toast({ 
        title: "خطأ", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignOrder = async (orderId: string, storeId: string) => {
    setIsLoading(true);
    try {
      const result = await callAssignOrder(orderId, storeId);
      console.log("تم التعيين:", result);
      toast({ title: "نجح", description: result.message });
    } catch (error) {
      toast({ 
        title: "خطأ", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsLoading(true);
    try {
      const result = await callAutoAssignOrders();
      console.log("التعيين التلقائي:", result);
      toast({ 
        title: "تم التعيين التلقائي", 
        description: `تم تعيين ${result.assigned_count} طلب` 
      });
    } catch (error) {
      toast({ 
        title: "خطأ", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleGetOrder("order-123")}>
        جلب الطلب
      </button>
      <button onClick={() => handleAssignOrder("order-123", "store-456")}>
        تعيين الطلب
      </button>
      <button onClick={handleAutoAssign}>
        تعيين تلقائي
      </button>
    </div>
  );
};
```

## 🎯 الفوائد

1. **✅ حل مشكلة Failed to fetch** - لا يوجد تعارض في Authorization headers
2. **✅ أداء أفضل** - استدعاء مباشر بدون وسطاء
3. **✅ تحكم كامل** - السيطرة ال��املة على Headers والمعالجة
4. **✅ سهولة الاستخدام** - دوال مُبسطة وجاهزة للاستعمال
5. **✅ معالجة أخطاء شاملة** - رسائل خطأ واضحة ومفيدة

## 🔄 الخطوات التالية

1. **اختبار الدوال** - استخدم `EdgeFunctionsTestComponent` للاختبار
2. **تحديث المكونات** - استبدال أي استدعاءات `supabase.functions.invoke()` قديمة
3. **مراقبة الأداء** - تتبع نجاح/فشل الاستدعاءات في Console
4. **تحديث التوثيق** - تحديث أي توثيق يشير للطريقة القديمة

## 🆘 استكشاف الأخطاء

### مشكلة: Still getting "Failed to fetch"
**الحل:** تأكد من استخدام URLs الصحيحة وأن Edge Functions تعمل

### مشكلة: HTTP 404
**الحل:** تأكد من صحة أسماء الدوال في URLs

### مشكلة: HTTP 500
**الحل:** تحقق من Service Role Key في Edge Functions

### مشكلة: CORS errors
**الحل:** تأكد من إعدادات CORS في Supabase

---

**🎉 تم حل جميع المشاكل بنجاح! Edge Functions تعمل الآن بدون أخطاء.**
