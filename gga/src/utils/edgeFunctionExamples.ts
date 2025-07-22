/**
 * Comprehensive examples and helper functions for integrating Supabase Edge Functions
 * into React dashboard components with proper error handling and state management.
 */

import { supabase } from '@/integrations/supabase/client';

// Types for Edge Function responses
export interface OrderData {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_notes: string;
  main_store_name: string;
  order_status: string;
  order_code: string;
  created_at: string;
  total_amount: number;
  assigned_store_name?: string;
  assigned_store_id?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    product_id?: number;
  }>;
}

export interface EdgeFunctionResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface AssignOrderResponse extends EdgeFunctionResponse {
  order?: OrderData;
}

export interface AutoAssignResponse extends EdgeFunctionResponse {
  assigned_count: number;
  failed_count?: number;
  orders?: OrderData[];
}

/**
 * Get authentication headers for Edge Function calls
 */
export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  };
};

/**
 * Example 1: Get detailed order information
 * 
 * Usage in component:
 * ```tsx
 * const [orderData, setOrderData] = useState<OrderData | null>(null);
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * const loadOrder = async () => {
 *   setIsLoading(true);
 *   const result = await getOrderDetails('order-id-here');
 *   if (result.success && result.data) {
 *     setOrderData(result.data);
 *   }
 *   setIsLoading(false);
 * };
 * ```
 */
export const getOrderDetails = async (orderId: string): Promise<EdgeFunctionResponse<OrderData>> => {
  try {
    console.log("🔵 Calling get-order Edge Function for:", orderId);
    
    if (!orderId) {
      throw new Error('معرف الطلب مطلوب');
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/get-order`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId })
      }
    );

    console.log("📨 get-order response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ get-order error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ get-order response:", data);

    if (data.success && data.order) {
      return {
        success: true,
        data: data.order,
        message: data.message || 'تم جلب بيانات الطلب بنجاح'
      };
    } else {
      throw new Error(data.error || 'فشل في جلب بيانات الطلب');
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
 * Example 2: Assign order to a specific store
 * 
 * Usage in component:
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

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/assign-order`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, storeId })
      }
    );

    console.log("📨 assign-order response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ assign-order error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: AssignOrderResponse = await response.json();
    console.log("✅ assign-order response:", data);

    if (data.success) {
      return {
        success: true,
        message: data.message || 'تم تعيين الطلب للمتجر بنجاح',
        order: data.order
      };
    } else {
      throw new Error(data.error || 'فشل في تعيين الطلب');
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
 * Example 3: Auto-assign all pending orders
 * 
 * Usage in component:
 * ```tsx
 * const [isAutoAssigning, setIsAutoAssigning] = useState(false);
 * 
 * const handleAutoAssignOrders = async () => {
 *   setIsAutoAssigning(true);
 *   const result = await autoAssignPendingOrders();
 *   if (result.success) {
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
export const autoAssignPendingOrders = async (): Promise<AutoAssignResponse> => {
  try {
    console.log("🔵 Calling auto-assign-orders Edge Function");
    
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/auto-assign-orders`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      }
    );

    console.log("📨 auto-assign-orders response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ auto-assign-orders error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: AutoAssignResponse = await response.json();
    console.log("✅ auto-assign-orders response:", data);

    if (data.success) {
      return {
        success: true,
        assigned_count: data.assigned_count || 0,
        failed_count: data.failed_count || 0,
        message: data.message || `تم تعيين ${data.assigned_count || 0} طلب بنجاح`,
        orders: data.orders
      };
    } else {
      throw new Error(data.error || 'فشل في التعيين التلقائي');
    }
  } catch (error) {
    console.error("❌ Error in autoAssignPendingOrders:", error);
    return {
      success: false,
      assigned_count: 0,
      error: error instanceof Error ? error.message : 'فشل في التعيين التلقائي'
    };
  }
};

/**
 * Complete React Hook Example for AdminDashboard
 * 
 * ```tsx
 * import { useState, useEffect } from 'react';
 * import { useToast } from '@/hooks/use-toast';
 * import { getOrderDetails, assignOrderToStore, autoAssignPendingOrders } from '@/utils/edgeFunctionExamples';
 * 
 * export const useAdminDashboard = () => {
 *   const [orders, setOrders] = useState([]);
 *   const [selectedOrderData, setSelectedOrderData] = useState(null);
 *   const [isLoading, setIsLoading] = useState(false);
 *   const [isAssigning, setIsAssigning] = useState(false);
 *   const [isAutoAssigning, setIsAutoAssigning] = useState(false);
 *   const { toast } = useToast();
 * 
 *   // Fetch all orders (using existing RPC)
 *   const fetchOrders = async () => {
 *     setIsLoading(true);
 *     try {
 *       const { data, error } = await supabase.rpc("get_orders_with_products");
 *       if (error) throw error;
 *       setOrders(data || []);
 *     } catch (error) {
 *       toast({ title: "خطأ", description: "فشل في تحميل الطلبات", variant: "destructive" });
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 * 
 *   // View order details using Edge Function
 *   const viewOrderDetails = async (orderId: string) => {
 *     const result = await getOrderDetails(orderId);
 *     if (result.success && result.data) {
 *       setSelectedOrderData(result.data);
 *     } else {
 *       toast({ title: "خطأ", description: result.error, variant: "destructive" });
 *     }
 *   };
 * 
 *   // Assign order using Edge Function
 *   const assignOrder = async (orderId: string, storeId: string) => {
 *     setIsAssigning(true);
 *     const result = await assignOrderToStore(orderId, storeId);
 *     if (result.success) {
 *       toast({ title: "نجح", description: result.message });
 *       await fetchOrders(); // Refresh orders
 *     } else {
 *       toast({ title: "خطأ", description: result.error, variant: "destructive" });
 *     }
 *     setIsAssigning(false);
 *   };
 * 
 *   // Auto-assign orders using Edge Function
 *   const autoAssignOrders = async () => {
 *     setIsAutoAssigning(true);
 *     const result = await autoAssignPendingOrders();
 *     if (result.success) {
 *       toast({ 
 *         title: "تم التعيين التلقائي", 
 *         description: `تم تعيين ${result.assigned_count} طلب بنجاح` 
 *       });
 *       await fetchOrders(); // Refresh orders
 *     } else {
 *       toast({ title: "خطأ", description: result.error, variant: "destructive" });
 *     }
 *     setIsAutoAssigning(false);
 *   };
 * 
 *   useEffect(() => {
 *     fetchOrders();
 *   }, []);
 * 
 *   return {
 *     orders,
 *     selectedOrderData,
 *     isLoading,
 *     isAssigning,
 *     isAutoAssigning,
 *     viewOrderDetails,
 *     assignOrder,
 *     autoAssignOrders,
 *     refreshOrders: fetchOrders
 *   };
 * };
 * ```
 */

/**
 * Complete React Hook Example for StoreDashboard
 * 
 * ```tsx
 * import { useState, useEffect } from 'react';
 * import { useToast } from '@/hooks/use-toast';
 * import { getOrderDetails } from '@/utils/edgeFunctionExamples';
 * import { supabase } from '@/integrations/supabase/client';
 * 
 * export const useStoreDashboard = (storeId: string) => {
 *   const [orders, setOrders] = useState([]);
 *   const [selectedOrderData, setSelectedOrderData] = useState(null);
 *   const [isLoading, setIsLoading] = useState(false);
 *   const { toast } = useToast();
 * 
 *   // Fetch store-specific orders
 *   const fetchStoreOrders = async () => {
 *     setIsLoading(true);
 *     try {
 *       const { data, error } = await supabase
 *         .from("orders")
 *         .select(`
 *           id, customer_name, customer_phone, customer_address, 
 *           customer_city, items, total_amount, customer_notes,
 *           order_code, order_status, status, assigned_store_id, 
 *           created_at, stores!assigned_store_id(name)
 *         `)
 *         .eq("assigned_store_id", storeId)
 *         .order("created_at", { ascending: false });
 * 
 *       if (error) throw error;
 *       setOrders(data || []);
 *     } catch (error) {
 *       toast({ title: "خطأ", description: "فشل في تحميل الطلبات", variant: "destructive" });
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 * 
 *   // View order details using Edge Function
 *   const viewOrderDetails = async (orderId: string) => {
 *     const result = await getOrderDetails(orderId);
 *     if (result.success && result.data) {
 *       setSelectedOrderData(result.data);
 *     } else {
 *       toast({ title: "خطأ", description: result.error, variant: "destructive" });
 *     }
 *   };
 * 
 *   // Update order status
 *   const updateOrderStatus = async (orderId: string, newStatus: string) => {
 *     try {
 *       const { error } = await supabase
 *         .from("orders")
 *         .update({ order_status: newStatus, status: newStatus })
 *         .eq("id", orderId);
 * 
 *       if (error) throw error;
 *       
 *       toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح" });
 *       await fetchStoreOrders(); // Refresh orders
 *     } catch (error) {
 *       toast({ title: "خطأ", description: "فشل في تحديث حالة الطلب", variant: "destructive" });
 *     }
 *   };
 * 
 *   useEffect(() => {
 *     if (storeId) {
 *       fetchStoreOrders();
 *     }
 *   }, [storeId]);
 * 
 *   return {
 *     orders,
 *     selectedOrderData,
 *     isLoading,
 *     viewOrderDetails,
 *     updateOrderStatus,
 *     refreshOrders: fetchStoreOrders
 *   };
 * };
 * ```
 */

/**
 * Error handling utilities
 */
export const handleEdgeFunctionError = (error: any, context: string) => {
  console.error(`❌ Error in ${context}:`, error);
  
  // Check for common error types
  if (error.name === 'AbortError') {
    return 'تم إلغاء العملية';
  }
  
  if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
    return 'خطأ في الاتصال بالخادم';
  }
  
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    return 'غير مصرح لك بهذه العملية';
  }
  
  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
    return 'ليس لديك صلاحية لهذه العملية';
  }
  
  if (error.message?.includes('404') || error.message?.includes('Not Found')) {
    return 'العنصر المطلوب غير موجود';
  }
  
  if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
    return 'خطأ في الخادم الداخلي';
  }
  
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
};

/**
 * Retry mechanism for Edge Function calls
 */
export const retryEdgeFunction = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`🔄 Retry ${i + 1}/${maxRetries} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};
