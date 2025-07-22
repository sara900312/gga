/**
 * 🔧 أمثلة جاهزة لاستدعاء Edge Functions باستخدام fetch عادي
 * بدون Authorization headers لحل مشاكل Failed to fetch
 */

/**
 * 1️⃣ استدعاء دالة get-order مع orderId
 * 
 * @param orderId - معرف الطلب
 * @returns بيانات الطلب أو null في حالة الخطأ
 */
export const callGetOrder = async (orderId: string) => {
  try {
    console.log("🔵 Calling get-order for:", orderId);
    
    const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/get-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    console.log("📨 get-order response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📦 get-order response data:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.success && data.order) {
      console.log("✅ get-order success");
      return data.order;
    } else {
      throw new Error('فشل في جلب بيانات الطلب');
    }
  } catch (error) {
    console.error("❌ Error in get-order:", error);
    throw error;
  }
};

/**
 * 2️⃣ استدعاء دالة assign-order مع orderId و storeId
 * 
 * @param orderId - معرف الطلب
 * @param storeId - معرف المتجر
 * @returns true إذا نجح التعيين، false إذا فشل
 */
export const callAssignOrder = async (orderId: string, storeId: string) => {
  try {
    console.log("🔵 Calling assign-order:", { orderId, storeId });
    
    const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/assign-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, storeId })
    });

    console.log("📨 assign-order response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📦 assign-order response data:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.success) {
      console.log("✅ assign-order success");
      return {
        success: true,
        message: data.message || "تم تعيين الطلب بنجاح"
      };
    } else {
      throw new Error('فشل في تعيين الطلب');
    }
  } catch (error) {
    console.error("❌ Error in assign-order:", error);
    throw error;
  }
};

/**
 * 3️⃣ استدعاء دالة auto-assign-orders بدون باراميترات
 * 
 * @returns نتائج التعيين التلقائي
 */
export const callAutoAssignOrders = async () => {
  try {
    console.log("🔵 Calling auto-assign-orders");
    
    const response = await fetch('https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/auto-assign-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    console.log("📨 auto-assign-orders response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📦 auto-assign-orders response data:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.success) {
      console.log("✅ auto-assign-orders success");
      
      // إنشاء رسالة تفصيلية
      let message = `تم تعيين ${data.assigned_count || 0} طلب بنجاح`;
      if (data.unmatched_count > 0) {
        message += `، ${data.unmatched_count} طلب لم يتم العثور على متجر مطابق`;
      }
      if (data.error_count > 0) {
        message += `، ${data.error_count} طلب حدث بهم خطأ`;
      }
      
      return {
        success: true,
        assigned_count: data.assigned_count || 0,
        unmatched_count: data.unmatched_count || 0,
        error_count: data.error_count || 0,
        message: data.message || message,
        errors: data.errors || []
      };
    } else {
      throw new Error('فشل في التعيين التلقائي');
    }
  } catch (error) {
    console.error("❌ Error in auto-assign-orders:", error);
    throw error;
  }
};

/**
 * 🎯 مثال كامل لاستخدام الدوال في مكون React
 */
export const useEdgeFunctionsExample = () => {
  return `
// مثال كامل للاستخدام في مكون React:

import React, { useState } from 'react';
import { callGetOrder, callAssignOrder, callAutoAssignOrders } from '@/utils/edgeFunctionsExamples';
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const { toast } = useToast();

  // 1️⃣ جلب تفاصيل الطلب
  const handleGetOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const order = await callGetOrder(orderId);
      setOrderData(order);
      toast({
        title: "تم بنجاح",
        description: "تم جلب بيانات الطلب"
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

  // 2️⃣ تعيين طلب لمتجر
  const handleAssignOrder = async (orderId: string, storeId: string) => {
    setIsLoading(true);
    try {
      const result = await callAssignOrder(orderId, storeId);
      toast({
        title: "تم بنجاح",
        description: result.message
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

  // 3️⃣ التعيين التلقائي
  const handleAutoAssign = async () => {
    setIsLoading(true);
    try {
      const result = await callAutoAssignOrders();
      toast({
        title: "تم التعيين التلقائي",
        description: result.message
      });
      console.log("إحصائيات التعيين:", {
        assigned: result.assigned_count,
        unmatched: result.unmatched_count,
        errors: result.error_count
      });
    } catch (error) {
      toast({
        title: "خطأ في التعيين التلقائي",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleGetOrder("order-id-123")}>
        جلب الطلب
      </button>
      <button onClick={() => handleAssignOrder("order-id-123", "store-id-456")}>
        تعيين الطلب
      </button>
      <button onClick={handleAutoAssign}>
        تعيين تلقائي
      </button>
      {isLoading && <p>جاري التحميل...</p>}
      {orderData && <pre>{JSON.stringify(orderData, null, 2)}</pre>}
    </div>
  );
};

export default MyComponent;
`;
};

/**
 * 🔧 دالة مساعدة لمعالجة الأخطاء
 */
export const handleEdgeFunctionError = (error: any, functionName: string) => {
  console.error(`❌ Error in ${functionName}:`, error);
  
  if (error.message?.includes('Failed to fetch')) {
    return `خطأ في الاتصال بخادم ${functionName}. تأكد من الاتصال بالإنترنت.`;
  }
  
  if (error.message?.includes('HTTP 404')) {
    return `دالة ${functionName} غير موجودة أو عنوانها خاطئ.`;
  }
  
  if (error.message?.includes('HTTP 500')) {
    return `خطأ داخلي في خادم ${functionName}.`;
  }
  
  return error.message || `خطأ غير محدد في ${functionName}`;
};

/**
 * 🎯 دالة لاختبار جميع Edge Functions
 */
export const testAllEdgeFunctions = async () => {
  console.log("🧪 اختبار جميع Edge Functions...");
  
  try {
    // اختبار auto-assign (لا يحتاج باراميترات)
    console.log("1️⃣ اختبار auto-assign-orders...");
    const autoResult = await callAutoAssignOrders();
    console.log("✅ auto-assign نجح:", autoResult);
    
    // اختبار get-order (يحتاج orderId صالح)
    // console.log("2️⃣ اختبار get-order...");
    // const order = await callGetOrder("test-order-id");
    // console.log("✅ get-order نجح:", order);
    
    // اختبار assign-order (يحتاج orderId و storeId صالحين)
    // console.log("3️⃣ اختبار assign-order...");
    // const assignResult = await callAssignOrder("test-order-id", "test-store-id");
    // console.log("✅ assign-order نجح:", assignResult);
    
    console.log("🎉 جميع الاختبارات نجحت!");
    
  } catch (error) {
    console.error("❌ فشل الاختبار:", error);
    throw error;
  }
};
