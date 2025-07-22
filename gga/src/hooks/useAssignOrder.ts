import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AssignOrderResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

interface UseAssignOrderResult {
  assignOrder: (
    orderId: string,
    storeId: string,
  ) => Promise<AssignOrderResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: AssignOrderResponse | null;
}

/**
 * Hook لتعيين الطلبات للمتاجر باستخدام Supabase Edge Function
 * يتعامل مع Authentication, Loading, Error handling
 */
export const useAssignOrder = (): UseAssignOrderResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AssignOrderResponse | null>(
    null,
  );
  const { toast } = useToast();

  const assignOrder = async (
    orderId: string,
    storeId: string,
  ): Promise<AssignOrderResponse> => {
    // التحقق من صحة المدخلات
    if (!orderId || !storeId) {
      const errorMsg = "معرف الطلب ومعرف المتجر مطلوبان";
      setError(errorMsg);
      toast({
        title: "خطأ في البيانات",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false, error: errorMsg };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 بدء تعيين الطلب:", { orderId, storeId });

      // الحصول على session للتأكد من وجود توكن صالح
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ خطأ في جلب Session:", sessionError);
        throw new Error("فشل في التحقق من صلاحية المستخدم");
      }

      if (!session) {
        console.error("❌ لا يوجد session صالح");
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      console.log("✅ Session موجود:", session.user.email);

      // استدعاء Edge Function
      const { data, error } = await supabase.functions.invoke("assign-order", {
        body: {
          orderId,
          storeId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log("📨 استجابة Edge Function:", { data, error });

      // التحقق من وجود خطأ في الاستدعاء
      if (error) {
        console.error("❌ خطأ في استدعاء Edge Function:", error);
        throw new Error(error.message || "فشل في استدعاء خدمة التعيين");
      }

      // التحقق من نجاح العملية
      if (data?.success) {
        const successMsg = data.message || "تم تعيين الطلب بنجاح";
        console.log("✅ تم تعيين الطلب بنجاح:", data);

        toast({
          title: "تم بنجاح",
          description: successMsg,
        });

        const response: AssignOrderResponse = {
          success: true,
          message: successMsg,
          data: data.data,
        };

        setLastResponse(response);
        return response;
      } else {
        // فشل في العملية من جانب الخادم
        const errorMsg = data?.error || "فشل في تعيين الطلب";
        console.error("❌ فشل في تعيين الطلب:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      console.error("❌ خطأ في useAssignOrder:", error);

      setError(errorMessage);
      toast({
        title: "خطأ في التعيين",
        description: errorMessage,
        variant: "destructive",
      });

      const errorResponse: AssignOrderResponse = {
        success: false,
        error: errorMessage,
      };

      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assignOrder,
    isLoading,
    error,
    lastResponse,
  };
};

/**
 * دالة مساعدة لاستدعاء assign-order Edge Function مباشرة
 * بدون React hooks - مفيدة للاستخدام خارج React components
 */
export const assignOrderDirectly = async (
  orderId: string,
  storeId: string,
): Promise<AssignOrderResponse> => {
  try {
    console.log("🔄 [Direct] بدء تعيين الطلب:", { orderId, storeId });

    // الحصول على Supabase client
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // استدعاء Edge Function
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/assign-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabase.supabaseKey,
        },
        body: JSON.stringify({ orderId, storeId }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📨 [Direct] استجابة Edge Function:", data);

    if (data.success) {
      return {
        success: true,
        message: data.message || "تم تعيين الطلب بنجاح",
        data: data.data,
      };
    } else {
      throw new Error(data.error || "فشل في تعيين الطلب");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "حدث خطأ غير متوقع";
    console.error("❌ [Direct] خطأ في تعيين الطلب:", error);

    return {
      success: false,
      error: errorMessage,
    };
  }
};
