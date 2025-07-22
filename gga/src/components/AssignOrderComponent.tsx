import React, { useState } from "react";
import { useAssignOrderEdgeFunction } from "@/hooks/useAssignOrderEdgeFunction";

interface AssignOrderComponentProps {
  onAssignmentSuccess?: (
    orderId: string,
    storeId: string,
    response: any,
  ) => void;
  onAssignmentError?: (orderId: string, storeId: string, error: string) => void;
  showMessages?: boolean; // تحكم في عرض الرسائل
}

/**
 * مكون React لتعيين الطلبات للمتاجر
 * يوفر واجهة بسيطة لاستخدام Edge Function
 */
const AssignOrderComponent: React.FC<AssignOrderComponentProps> = ({
  onAssignmentSuccess,
  onAssignmentError,
  showMessages = true,
}) => {
  const [orderId, setOrderId] = useState("");
  const [storeId, setStoreId] = useState("");

  const { assignOrder, isLoading, error, lastResponse, clearError } =
    useAssignOrderEdgeFunction();

  // معالج تعيين الطلب
  const handleAssignOrder = async () => {
    if (!orderId.trim() || !storeId.trim()) {
      alert("Please enter both Order ID and Store ID");
      return;
    }

    const result = await assignOrder(orderId.trim(), storeId.trim());

    if (result.success) {
      // استدعاء callback عند النجاح
      onAssignmentSuccess?.(orderId.trim(), storeId.trim(), result.data);

      // مسح المدخلات عند النجاح
      setOrderId("");
      setStoreId("");
    } else {
      // استدعاء callback عند الخطأ
      onAssignmentError?.(
        orderId.trim(),
        storeId.trim(),
        result.error || "Unknown error",
      );
    }
  };

  // دالة يمكن استدعاؤها من خارج المكون
  const assignOrderProgrammatically = async (
    orderIdParam: string,
    storeIdParam: string,
  ) => {
    return await assignOrder(orderIdParam, storeIdParam);
  };

  // تعريض الدالة للمكون الأب
  React.useImperativeHandle(React.useRef(), () => ({
    assignOrder: assignOrderProgrammatically,
    isLoading,
    error,
    lastResponse,
    clearError,
  }));

  return (
    <div
      style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}
    >
      <h3>تعيين طلب لمتجر</h3>

      {/* عرض الأخطاء */}
      {showMessages && error && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#d00",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          ❌ خطأ: {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: "10px",
              background: "none",
              border: "none",
              color: "#d00",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* عرض رسالة النجاح */}
      {showMessages && lastResponse?.success && (
        <div
          style={{
            backgroundColor: "#e6ffe6",
            color: "#006600",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          ✅ {lastResponse.message}
        </div>
      )}

      {/* المدخلات */}
      <div style={{ marginBottom: "10px" }}>
        <label
          htmlFor="orderId"
          style={{ display: "block", marginBottom: "5px" }}
        >
          Order ID:
        </label>
        <input
          id="orderId"
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter order ID..."
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label
          htmlFor="storeId"
          style={{ display: "block", marginBottom: "5px" }}
        >
          Store ID:
        </label>
        <input
          id="storeId"
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          placeholder="Enter store ID..."
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>

      {/* زر التعيين */}
      <button
        onClick={handleAssignOrder}
        disabled={isLoading || !orderId.trim() || !storeId.trim()}
        style={{
          backgroundColor: isLoading ? "#ccc" : "#007bff",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontSize: "14px",
          width: "100%",
        }}
      >
        {isLoading ? "جاري التعيين..." : "تعيين الطلب"}
      </button>

      {/* معلومات إضافية أثناء التطوير */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <strong>Debug Info:</strong>
          <br />
          Loading: {isLoading ? "Yes" : "No"}
          <br />
          Last Response:{" "}
          {lastResponse ? JSON.stringify(lastResponse, null, 2) : "None"}
        </div>
      )}
    </div>
  );
};

export default AssignOrderComponent;

// نوع للـ ref إذا كنت تريد الوصول للدوال من المكون الأب
export interface AssignOrderComponentRef {
  assignOrder: (orderId: string, storeId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  lastResponse: any;
  clearError: () => void;
}
