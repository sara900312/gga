import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

type OrderWithProduct = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  product_name: string;
  product_price: number;
  store_name: string;
  created_at: string;
  order_code: string;
  order_status: string;
  assigned_store_id: string;
  total_amount: number;
  order_details: string;
};

interface UseOrdersOptions {
  autoFetch?: boolean;
  storeId?: string | null; // لجلب طلبات متجر معين
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { autoFetch = true, storeId } = options;

  // جلب جميع الطلبات مع تفاصيل المنتجات
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("get_orders_with_products");

      if (error) {
        throw new Error(error.message);
      }

      let filteredOrders = data || [];

      // فلترة الطلبات حسب المتجر إذا تم تحديد معرف المتجر
      if (storeId) {
        filteredOrders = filteredOrders.filter(
          (order: OrderWithProduct) => order.assigned_store_id === storeId,
        );
      }

      setOrders(filteredOrders);
      return { success: true, data: filteredOrders };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "فشل في جلب الطلبات";
      setError(errorMsg);
      console.error("Error fetching orders:", error);

      toast({
        title: "خطأ في جلب البيانات",
        description: errorMsg,
        variant: "destructive",
      });

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [storeId, toast]);

  // جلب طلب واحد بالمعرف
  const fetchOrderById = useCallback(async (orderId: string) => {
    if (!orderId) {
      const errorMsg = "معرف الطلب مطلوب";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "فشل في جلب الطلب";
      setError(errorMsg);
      console.error("Error fetching order:", error);

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // جلب الطلبات حسب الحالة
  const fetchOrdersByStatus = useCallback(async (status: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("get_orders_with_products");

      if (error) {
        throw new Error(error.message);
      }

      const filteredOrders = (data || []).filter(
        (order: OrderWithProduct) =>
          order.order_status === status || order.order_status === status,
      );

      return { success: true, data: filteredOrders };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "فشل في جلب الطلبات";
      setError(errorMsg);
      console.error("Error fetching orders by status:", error);

      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // إعادة تحميل البيانات بعد التحديثات
  const refreshOrders = useCallback(() => {
    return fetchOrders();
  }, [fetchOrders]);

  // احصائيات الطلبات
  const getOrderStats = useCallback(() => {
    const stats = {
      total: orders.length,
      pending: orders.filter(
        (order) =>
          order.order_status === "pending" || order.order_status === null,
      ).length,
      assigned: orders.filter((order) => order.order_status === "assigned")
        .length,
      delivered: orders.filter((order) => order.order_status === "delivered")
        .length,
      returned: orders.filter((order) => order.order_status === "returned")
        .length,
    };

    return stats;
  }, [orders]);

  // جلب البيانات تلقائياً عند تحميل الهوك
  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  // الاشتراك في تحديثات الطلبات في الوقت الفعلي
  useEffect(() => {
    const ordersSubscription = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Order updated:", payload);
          // إعادة جلب البيانات عند حدوث تغيير
          refreshOrders();
        },
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [refreshOrders]);

  return {
    // Data
    orders,
    orderStats: getOrderStats(),

    // States
    isLoading,
    error,

    // Functions
    fetchOrders,
    fetchOrderById,
    fetchOrdersByStatus,
    refreshOrders,

    // Utilities
    clearError: () => setError(null),
  };
};
