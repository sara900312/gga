import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

interface UseOrderAssignmentOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useOrderAssignment = (options: UseOrderAssignmentOptions = {}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // تحديث حالة الطلب مع متجر معين
  const assignOrderToStore = async (orderId: string, storeId: string) => {
    if (!orderId || !storeId) {
      const errorMsg = "معرف الطلب ومعرف المتجر مطلوبان";
      toast({
        title: "خطأ في البيانات",
        description: errorMsg,
        variant: "destructive",
      });
      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsAssigning(true);

    try {
      // استخدام Edge Function لتحديث الطلب
      const { data, error } = await supabase.functions.invoke("assign-order", {
        body: { orderId, storeId },
      });

      if (error) {
        throw new Error(error.message || "فشل في استدعاء الخدمة");
      }

      if (data?.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تعيين الطلب للمتجر بنجاح",
        });

        options.onSuccess?.();
        return { success: true, data: data.data };
      } else {
        throw new Error(data?.error || "فشل في تعيين الطلب");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      console.error("Error assigning order:", error);

      toast({
        title: "خطأ في التعيين",
        description: errorMsg,
        variant: "destructive",
      });

      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAssigning(false);
    }
  };

  // تحديث حالة الطلب مباشرة (بدون Edge Function)
  const updateOrderStatus = async (
    orderId: string,
    updates: {
      assigned_store_id?: string | null;
      order_status?: string;
      status?: string;
    },
  ) => {
    if (!orderId) {
      const errorMsg = "معرف الطلب مطلوب";
      toast({
        title: "خطأ في البيانات",
        description: errorMsg,
        variant: "destructive",
      });
      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });

      options.onSuccess?.();
      return { success: true, data };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "فشل في تحديث الطلب";
      console.error("Error updating order:", error);

      toast({
        title: "خطأ في التحديث",
        description: errorMsg,
        variant: "destructive",
      });

      options.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUpdating(false);
    }
  };

  // تعيين طلب لمتجر مع تحديث الحالة إلى 'assigned'
  const assignOrderWithStatus = async (orderId: string, storeId: string) => {
    return updateOrderStatus(orderId, {
      assigned_store_id: storeId,
      order_status: "assigned",
      status: "assigned",
    });
  };

  // إلغاء تعيين طلب من متجر
  const unassignOrder = async (orderId: string) => {
    return updateOrderStatus(orderId, {
      assigned_store_id: null,
      order_status: "pending",
      status: "pending",
    });
  };

  // تحديث حالة الطلب إلى مسلم
  const markOrderAsDelivered = async (orderId: string) => {
    return updateOrderStatus(orderId, {
      order_status: "delivered",
      status: "delivered",
    });
  };

  // تحديث حالة الطلب إلى مرتجع
  const markOrderAsReturned = async (orderId: string) => {
    return updateOrderStatus(orderId, {
      order_status: "returned",
      status: "returned",
    });
  };

  return {
    // Functions
    assignOrderToStore,
    updateOrderStatus,
    assignOrderWithStatus,
    unassignOrder,
    markOrderAsDelivered,
    markOrderAsReturned,

    // States
    isAssigning,
    isUpdating,
    isLoading: isAssigning || isUpdating,
  };
};
