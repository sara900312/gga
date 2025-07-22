import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AssignOrderResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface UseAssignOrderEdgeFunctionReturn {
  assignOrder: (
    orderId: string,
    storeId: string,
  ) => Promise<AssignOrderResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: AssignOrderResponse | null;
  clearError: () => void;
}

/**
 * React Hook لتعيين الطلبات للمتاجر باستخدام Supabase Edge Function
 *
 * @returns {UseAssignOrderEdgeFunctionReturn} كائن يحتوي على دالة التعيين وحالات التحميل والأخطاء
 */
export const useAssignOrderEdgeFunction =
  (): UseAssignOrderEdgeFunctionReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResponse, setLastResponse] =
      useState<AssignOrderResponse | null>(null);

    // مسح الأخطاء
    const clearError = useCallback(() => {
      setError(null);
    }, []);

    /**
     * دالة تعيين الطلب للمتجر
     *
     * @param {string} orderId - معرف الطلب
     * @param {string} storeId - معرف المتجر
     * @returns {Promise<AssignOrderResponse>} نتيجة العملية
     */
    const assignOrder = useCallback(
      async (
        orderId: string,
        storeId: string,
      ): Promise<AssignOrderResponse> => {
        // التحقق من صحة المدخلات
        if (!orderId || !storeId) {
          const errorMsg = "Order ID and Store ID are required";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        setIsLoading(true);
        setError(null);

        try {
          console.log("🔄 Starting order assignment:", { orderId, storeId });

          // الحصول على session للتحقق من Authentication
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("❌ Session error:", sessionError);
            throw new Error("Authentication failed");
          }

          if (!session?.access_token) {
            console.error("❌ No valid session found");
            throw new Error("No valid authentication token found");
          }

          console.log("✅ Valid session found for user:", session.user?.email);

          // إعداد URL للـ Edge Function
          const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/assign-order`;

          // إعداد البيانات المرسلة
          const requestBody = {
            orderId,
            storeId,
          };

          // إعداد Headers
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabase.supabaseKey,
          };

          console.log("📤 Sending request to Edge Function:", {
            url: edgeFunctionUrl,
            body: requestBody,
            headers: {
              "Content-Type": headers["Content-Type"],
              Authorization: `Bearer ${session.access_token.substring(0, 20)}...`,
              apikey: `${supabase.supabaseKey.substring(0, 20)}...`,
            },
          });

          // إرسال الطلب باستخدام fetch
          const response = await fetch(edgeFunctionUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
            mode: "cors", // تفعيل CORS
            credentials: "include",
          });

          console.log(
            "📨 Response status:",
            response.status,
            response.statusText,
          );

          // التحقق من حالة HTTP
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
              const errorData = await response.json();
              errorMessage =
                errorData.error || errorData.message || errorMessage;
            } catch (parseError) {
              console.warn("⚠️ Could not parse error response as JSON");
            }

            console.error("❌ HTTP Error:", errorMessage);
            throw new Error(errorMessage);
          }

          // تحليل الاستجابة
          const responseData = await response.json();
          console.log("📦 Response data:", responseData);

          // التحقق من نجاح العملية
          if (responseData.success) {
            console.log("✅ Assignment successful");

            const successResponse: AssignOrderResponse = {
              success: true,
              message: responseData.message || "Order assigned successfully",
              data: responseData.data,
            };

            setLastResponse(successResponse);
            return successResponse;
          } else {
            // فشل في العملية من جانب Edge Function
            const errorMsg = responseData.error || "Assignment failed";
            console.error("❌ Assignment failed:", errorMsg);
            throw new Error(errorMsg);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          console.error("❌ Assignment error:", error);

          setError(errorMessage);

          const errorResponse: AssignOrderResponse = {
            success: false,
            error: errorMessage,
          };

          setLastResponse(errorResponse);
          return errorResponse;
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

    return {
      assignOrder,
      isLoading,
      error,
      lastResponse,
      clearError,
    };
  };

/**
 * دالة مستقلة لتعيين الطلب (بدون React hooks)
 * مفيدة للاستخدام خارج React components
 *
 * @param {string} orderId - معرف الطلب
 * @param {string} storeId - معرف المتجر
 * @returns {Promise<AssignOrderResponse>} نتيجة العملية
 */
export const assignOrderDirectly = async (
  orderId: string,
  storeId: string,
): Promise<AssignOrderResponse> => {
  try {
    console.log("🔄 [Direct] Starting order assignment:", { orderId, storeId });

    // التحقق من صحة المدخلات
    if (!orderId || !storeId) {
      throw new Error("Order ID and Store ID are required");
    }

    // الحصول على session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Authentication required");
    }

    // إعداد الطلب
    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/assign-order`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabase.supabaseKey,
      },
      body: JSON.stringify({ orderId, storeId }),
      mode: "cors",
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // ignore parse error, use default message
      }

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log("📦 [Direct] Response data:", responseData);

    if (responseData.success) {
      return {
        success: true,
        message: responseData.message || "Order assigned successfully",
        data: responseData.data,
      };
    } else {
      throw new Error(responseData.error || "Assignment failed");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ [Direct] Assignment error:", error);

    return {
      success: false,
      error: errorMessage,
    };
  }
};
