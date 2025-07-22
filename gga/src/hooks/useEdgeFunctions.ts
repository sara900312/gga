import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Updated interface for new Edge Function response structure
interface OrderData {
  order_id: string;
  customer_name: string;
  customer_phone: string | number;
  customer_address: string;
  customer_notes?: string;
  main_store_name: string;
  order_status: string;
  order_code: string;
  created_at: string;
  total_amount: number;
  assigned_store_name?: string;
  assigned_store_id?: string;
  items?: Array<{
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      discounted_price?: number | null;
      main_store_name: string;
    };
  }>;
}

interface EdgeFunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface GetOrderResponse extends EdgeFunctionResponse {
  order?: any;
  order_items?: any[];
  assigned_store?: any;
}

interface AssignOrderResponse extends EdgeFunctionResponse {
  store_name?: string;
}

interface AutoAssignResponse extends EdgeFunctionResponse {
  assigned_count: number;
  unmatched_count?: number;
  error_count?: number;
  errors?: string[];
}

export const useEdgeFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const { toast } = useToast();

  const EDGE_FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_EDGE_FUNCTIONS_BASE || 'https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1';

  // Simplified callEdgeFunction method - using correct Edge Functions URL
  const callEdgeFunction = async (functionName: string, body: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔵 Calling Edge Function: ${functionName}`, body);

      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log(`📨 ${functionName} response status:`, response.status);

      if (!response.ok) {
        // Read response only once and store it
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, fallback to text
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Read response only once
      const result = await response.json();
      console.log(`📨 ${functionName} response data:`, result);
      return result;

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
      console.error(`❌ Error in ${functionName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderId: string): Promise<GetOrderResponse | null> => {
    setLoading(true);

    try {
      console.log("🔵 Calling get-order for:", orderId);

      // استخدام fetch عادي بدون Authorization headers
      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/get-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });

      console.log("📨 get-order response status:", response.status);

      if (!response.ok) {
        // Read response only once for error handling
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }

        console.error("❌ get-order HTTP error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        if (response.status === 500) {
          throw new Error(`خطأ في الخادم: تأكد من أن Edge Function محدّث ومنشور. الرجاء نشر get-order function. (HTTP ${response.status})`);
        } else if (response.status === 404) {
          throw new Error(`Edge Function غير موجود. يرجى نشر get-order function. (HTTP ${response.status})`);
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
      }

      // Read response only once
      const data: GetOrderResponse = await response.json();
      console.log("📨 get-order response data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        console.log("✅ get-order success:", data);
        return data;
      } else {
        throw new Error(data?.error || 'فشل في جلب بيانات الطلب');
      }
    } catch (error) {
      console.error("❌ Error in getOrder Edge Function:", error);

      // Fallback: Try to get order from database directly
      console.log("🔄 Attempting fallback: getting order from database directly");
      try {
        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (fallbackError) {
          throw fallbackError;
        }

        if (fallbackOrder) {
          console.log("✅ Fallback successful: got order from database", fallbackOrder);

          toast({
            title: "تحذير",
            description: "تم جلب البيانات من قاعدة البيانات مباشرة (Edge Function غير متاح)",
            variant: "default",
          });

          return {
            success: true,
            order: fallbackOrder,
            order_items: fallbackOrder.order_details ? JSON.parse(fallbackOrder.order_details) : [],
            assigned_store: fallbackOrder.assigned_store_id ? { id: fallbackOrder.assigned_store_id, name: fallbackOrder.assigned_store_name } : null
          };
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في جلب بيانات الطلب",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const assignOrder = async (orderId: string, storeId: string): Promise<boolean> => {
    setIsAssigning(true);

    try {
      console.log("🔵 Calling assign-order:", { orderId, storeId });

      // استخدام fetch عادي بدون Authorization headers
      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/assign-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, storeId })
      });

      console.log("📨 assign-order response status:", response.status);

      if (!response.ok) {
        // Read response only once for error handling
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Read response only once
      const data: AssignOrderResponse = await response.json();
      console.log("📨 assign-order response data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        console.log("✅ assign-order success:", data);
        toast({
          title: "تم بنجاح",
          description: data.message || "تم تعيين الطلب للمتجر بنجاح",
        });
        return true;
      } else {
        throw new Error(data?.error || 'فشل في تعيين الطلب');
      }
    } catch (error) {
      console.error("❌ Error in assignOrder:", error);
      toast({
        title: "خطأ في التعيين",
        description: error instanceof Error ? error.message : "فشل في تعيين الطلب",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAssigning(false);
    }
  };

  const autoAssignOrders = async (): Promise<{ success: boolean; data?: AutoAssignResponse }> => {
    setIsAutoAssigning(true);

    try {
      console.log("🔵 Calling auto-assign-orders");

      // استخدام fetch عادي بدون Authorization headers
      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/auto-assign-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      console.log("📨 auto-assign-orders response status:", response.status);

      if (!response.ok) {
        // Read response only once for error handling
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || JSON.stringify(errorData);
        } catch {
          errorText = await response.text();
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Read response only once
      const data: AutoAssignResponse = await response.json();
      console.log("📨 auto-assign-orders response data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        console.log("✅ auto-assign-orders success:", data);

        // Create detailed message based on results
        let message = `تم تعيين ${data.assigned_count || 0} طلب بنجاح`;
        if (data.unmatched_count && data.unmatched_count > 0) {
          message += `، ${data.unmatched_count} طلب لم يتم العثور على متجر مطابق`;
        }
        if (data.error_count && data.error_count > 0) {
          message += `، ${data.error_count} طلب حدث بهم خطأ`;
        }

        toast({
          title: "تم التعيين التلقائي",
          description: data.message || message,
        });
        return { success: true, data };
      } else {
        throw new Error(data?.error || 'فشل في التعيين التلقائي');
      }
    } catch (error) {
      console.error("❌ Error in autoAssignOrders:", error);
      toast({
        title: "خطأ في التعيين التلقائي",
        description: error instanceof Error ? error.message : "فشل في التعيين التلقائي",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsAutoAssigning(false);
    }
  };

  return {
    // Simplified interface as requested
    callEdgeFunction,
    loading,
    error,

    // Original functions (for backward compatibility)
    getOrder,
    assignOrder,
    autoAssignOrders,

    // Loading states
    isLoading: loading,
    isAssigning,
    isAutoAssigning,
    isCreatingStore,
  };
};

export type {
  OrderData,
  EdgeFunctionResponse,
  GetOrderResponse,
  AssignOrderResponse,
  AutoAssignResponse
};
