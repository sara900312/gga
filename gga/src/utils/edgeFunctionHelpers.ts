/**
 * Updated Edge Functions helpers using supabase.functions.invoke() 
 * without Authorization headers as per the new requirements
 */

import { supabase } from '@/integrations/supabase/client';

// Types matching the Edge Function response structures
export interface OrderData {
  order_id: string;
  customer_name: string;
  customer_phone: string | number; // Can be string like "9647xxxxxxx" or number
  customer_address: string;
  customer_notes: string;
  main_store_name: string;
  order_status: string; // "assigned", "pending", etc.
  order_code: string;
  created_at: string; // timestamp
  total_amount: number;
  assigned_store_name?: string;
  assigned_store_id?: string;
  items: Array<{
    name: string;          // product name
    price: number;
    quantity: number;
    main_store: string;    // main store for this item
    product_id: number;
  }>;
}

export interface EdgeFunctionResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface GetOrderResponse extends EdgeFunctionResponse {
  order?: OrderData;
}

export interface AssignOrderResponse extends EdgeFunctionResponse {
  order?: OrderData;
}

export interface AutoAssignResponse extends EdgeFunctionResponse {
  assigned_count: number;
  unmatched_count?: number;
  error_count?: number;
  errors?: string[];
}

/**
 * 1. Get Order Details - Fetch detailed order information
 * 
 * Edge Function: get-order
 * Input: { orderId: string }
 * 
 * Usage:
 * ```tsx
 * const [orderData, setOrderData] = useState<OrderData | null>(null);
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * const loadOrderDetails = async (orderId: string) => {
 *   setIsLoading(true);
 *   const result = await getOrderDetails(orderId);
 *   if (result.success && result.order) {
 *     setOrderData(result.order);
 *   } else {
 *     console.error('Error:', result.error);
 *   }
 *   setIsLoading(false);
 * };
 * ```
 */
export const getOrderDetails = async (orderId: string): Promise<GetOrderResponse> => {
  try {
    console.log("🔵 Calling get-order Edge Function for:", orderId);
    
    if (!orderId || orderId.trim() === '') {
      throw new Error('معرف الطلب مطلوب');
    }

    const { data, error } = await supabase.functions.invoke('get-order', {
      body: { orderId }
    });

    console.log("📨 get-order response:", { data, error });

    if (error) {
      console.error("❌ get-order network error:", error);
      throw new Error(error.message || 'حدث خطأ في الشبكة');
    }

    if (data && data.success && data.order) {
      console.log("✅ get-order success:", data.order);
      return {
        success: true,
        order: data.order,
        message: data.message || 'تم جلب بيانات الطلب بنجاح'
      };
    } else {
      throw new Error(data?.error || 'فشل في جلب بيانات الطلب');
    }
  } catch (error) {
    console.error("❌ Error in getOrderDetails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'فشل في جلب بيانات الطلب'
    };
  }
};

/**
 * 2. Assign Order to Store - Manual order assignment
 * 
 * Edge Function: assign-order
 * Input: { orderId: string, storeId: string }
 * 
 * Usage:
 * ```tsx
 * const [isAssigning, setIsAssigning] = useState(false);
 * 
 * const handleAssignOrder = async (orderId: string, storeId: string) => {
 *   setIsAssigning(true);
 *   const result = await assignOrderToStore(orderId, storeId);
 *   if (result.success) {
 *     toast.success(result.message);
 *     // Refresh orders list
 *     await fetchOrders();
 *   } else {
 *     toast.error(result.error);
 *   }
 *   setIsAssigning(false);
 * };
 * ```
 */
export const assignOrderToStore = async (orderId: string, storeId: string): Promise<AssignOrderResponse> => {
  try {
    console.log("🔵 Calling assign-order Edge Function:", { orderId, storeId });
    
    if (!orderId || !storeId) {
      throw new Error('معرف الطلب ومعرف المتجر مطلوبان');
    }

    const { data, error } = await supabase.functions.invoke('assign-order', {
      body: { orderId, storeId }
    });

    console.log("📨 assign-order response:", { data, error });

    if (error) {
      console.error("❌ assign-order network error:", error);
      throw new Error(error.message || 'حدث خطأ في الشبكة');
    }

    if (data && data.success) {
      console.log("✅ assign-order success:", data);
      return {
        success: true,
        message: data.message || 'تم تعيين الطلب للمتجر بنجاح',
        order: data.order
      };
    } else {
      throw new Error(data?.error || 'فشل في تعيين الطلب');
    }
  } catch (error) {
    console.error("❌ Error in assignOrderToStore:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'فشل في تعيين الطلب'
    };
  }
};

/**
 * 3. Auto-Assign Orders - Automatically assign all pending orders
 * 
 * Edge Function: auto-assign-orders
 * Input: {} (no input required)
 * 
 * Usage:
 * ```tsx
 * const [isAutoAssigning, setIsAutoAssigning] = useState(false);
 * const [assignmentSummary, setAssignmentSummary] = useState(null);
 * 
 * const handleAutoAssignOrders = async () => {
 *   setIsAutoAssigning(true);
 *   const result = await autoAssignAllOrders();
 *   if (result.success) {
 *     setAssignmentSummary({
 *       assigned: result.assigned_count,
 *       unmatched: result.unmatched_count || 0,
 *       errors: result.error_count || 0
 *     });
 *     toast.success(`تم تعيين ${result.assigned_count} طلب بنجاح`);
 *     // Refresh orders list
 *     await fetchOrders();
 *   } else {
 *     toast.error(result.error);
 *   }
 *   setIsAutoAssigning(false);
 * };
 * ```
 */
export const autoAssignAllOrders = async (): Promise<AutoAssignResponse> => {
  try {
    console.log("🔵 Calling auto-assign-orders Edge Function");

    const { data, error } = await supabase.functions.invoke('auto-assign-orders', {
      body: {} // No input required
    });

    console.log("📨 auto-assign-orders response:", { data, error });

    if (error) {
      console.error("❌ auto-assign-orders network error:", error);
      throw new Error(error.message || 'حدث خطأ في الشبكة');
    }

    if (data && data.success) {
      console.log("✅ auto-assign-orders success:", data);
      
      const assignedCount = data.assigned_count || 0;
      const unmatchedCount = data.unmatched_count || 0;
      const errorCount = data.error_count || 0;
      
      // Create detailed message
      let message = `تم تعيين ${assignedCount} طلب بنجاح`;
      if (unmatchedCount > 0) {
        message += `، ${unmatchedCount} طلب لم يتم العثور على متجر مطابق له`;
      }
      if (errorCount > 0) {
        message += `، ${errorCount} طلب حدث به خطأ`;
      }

      return {
        success: true,
        assigned_count: assignedCount,
        unmatched_count: unmatchedCount,
        error_count: errorCount,
        message: data.message || message,
        errors: data.errors || []
      };
    } else {
      throw new Error(data?.error || 'فشل في التعيين التلقائي');
    }
  } catch (error) {
    console.error("❌ Error in autoAssignAllOrders:", error);
    return {
      success: false,
      assigned_count: 0,
      error: error instanceof Error ? error.message : 'فشل في التعيين التلقائي'
    };
  }
};

/**
 * Utility function to format order data for display
 */
export const formatOrderForDisplay = (order: OrderData) => {
  return {
    // Customer Information
    customerInfo: {
      name: order.customer_name || 'غير محدد',
      phone: order.customer_phone?.toString() || 'غير محدد',
      address: order.customer_address || 'غير محدد',
      notes: order.customer_notes || 'لا توجد ملاحظات'
    },
    
    // Order Information
    orderInfo: {
      code: order.order_code || order.order_id.slice(0, 8),
      status: order.order_status || 'غير محدد',
      createdAt: new Date(order.created_at).toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      totalAmount: order.total_amount || 0,
      mainStore: order.main_store_name || 'غير محدد',
      assignedStore: order.assigned_store_name || null
    },
    
    // Items Information
    items: order.items?.map(item => ({
      name: item.name || 'غير محدد',
      quantity: item.quantity || 1,
      price: item.price || 0,
      mainStore: item.main_store || 'غير محدد',
      total: (item.price || 0) * (item.quantity || 1)
    })) || []
  };
};

/**
 * Error handling utility
 */
export const handleEdgeFunctionError = (error: any, context: string) => {
  console.error(`❌ Error in ${context}:`, error);
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return `حدث خطأ غير متوقع في ${context}`;
};

/**
 * Complete React Hook Example for AdminDashboard
 */
export const useAdminDashboardWithEdgeFunctions = () => {
  // This would be imported in your AdminDashboard component like:
  // import { useAdminDashboardWithEdgeFunctions } from '@/utils/edgeFunctionHelpers';
  
  return `
// Example usage in AdminDashboard component:

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getOrderDetails, 
  assignOrderToStore, 
  autoAssignAllOrders,
  formatOrderForDisplay,
  type OrderData,
  type AutoAssignResponse 
} from '@/utils/edgeFunctionHelpers';

export const AdminDashboardExample = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [assignmentSummary, setAssignmentSummary] = useState<AutoAssignResponse | null>(null);
  const { toast } = useToast();

  // 1. View order details
  const handleViewOrder = async (orderId: string) => {
    setIsLoadingOrder(true);
    const result = await getOrderDetails(orderId);
    if (result.success && result.order) {
      setSelectedOrder(result.order);
      // You can also format it for display
      const formatted = formatOrderForDisplay(result.order);
      console.log('Formatted order:', formatted);
    } else {
      toast({ title: "خطأ", description: result.error, variant: "destructive" });
    }
    setIsLoadingOrder(false);
  };

  // 2. Assign order to store
  const handleAssignOrder = async (orderId: string, storeId: string) => {
    setIsAssigning(true);
    const result = await assignOrderToStore(orderId, storeId);
    if (result.success) {
      toast({ title: "نجح", description: result.message });
      // Refresh orders list
      await fetchOrders();
      // Refresh order details if viewing
      if (selectedOrder?.order_id === orderId) {
        await handleViewOrder(orderId);
      }
    } else {
      toast({ title: "خطأ", description: result.error, variant: "destructive" });
    }
    setIsAssigning(false);
  };

  // 3. Auto-assign all orders
  const handleAutoAssignOrders = async () => {
    setIsAutoAssigning(true);
    const result = await autoAssignAllOrders();
    if (result.success) {
      setAssignmentSummary(result);
      toast({ 
        title: "تم التعيين التلقائي", 
        description: result.message
      });
      // Refresh orders list
      await fetchOrders();
    } else {
      toast({ title: "خطأ", description: result.error, variant: "destructive" });
    }
    setIsAutoAssigning(false);
  };

  // Display assignment summary
  const renderAssignmentSummary = () => {
    if (!assignmentSummary) return null;
    
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">��تائج التعيين التلقائي</h3>
        <div className="space-y-1 text-sm">
          <div className="text-green-700">✅ تم تعيين: {assignmentSummary.assigned_count} طلب</div>
          {assignmentSummary.unmatched_count > 0 && (
            <div className="text-yellow-700">⚠️ غير مطابق: {assignmentSummary.unmatched_count} طلب</div>
          )}
          {assignmentSummary.error_count > 0 && (
            <div className="text-red-700">❌ أخطاء: {assignmentSummary.error_count} طلب</div>
          )}
        </div>
      </div>
    );
  };

  return {
    selectedOrder,
    isLoadingOrder,
    isAssigning,
    isAutoAssigning,
    assignmentSummary,
    handleViewOrder,
    handleAssignOrder,
    handleAutoAssignOrders,
    renderAssignmentSummary
  };
};
`;
};
