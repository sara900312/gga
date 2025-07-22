import React, { useRef } from "react";
import {
  useAssignOrderEdgeFunction,
  assignOrderDirectly,
} from "@/hooks/useAssignOrderEdgeFunction";
import AssignOrderComponent, {
  AssignOrderComponentRef,
} from "@/components/AssignOrderComponent";

/**
 * مثال شامل على كيفية استخدام نظام تعيين الطلبات
 */
const AssignOrderUsageExample: React.FC = () => {
  const componentRef = useRef<AssignOrderComponentRef>(null);

  // استخدام الـ Hook مباشرة
  const { assignOrder, isLoading, error, lastResponse } =
    useAssignOrderEdgeFunction();

  // مثال 1: استخدام الـ Hook مباشرة
  const handleDirectAssignment = async () => {
    const result = await assignOrder("order-123", "store-456");

    if (result.success) {
      console.log("✅ Assignment successful:", result);
      alert(`Success: ${result.message}`);
    } else {
      console.error("❌ Assignment failed:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  // مثال 2: استخدام الدالة المستقلة
  const handleDirectFunctionCall = async () => {
    const result = await assignOrderDirectly("order-789", "store-101");

    if (result.success) {
      console.log("✅ Direct assignment successful:", result);
      alert(`Success: ${result.message}`);
    } else {
      console.error("❌ Direct assignment failed:", result.error);
      alert(`Error: ${result.error}`);
    }
  };

  // مثال 3: استخدام المكون عبر ref
  const handleComponentRefAssignment = async () => {
    if (componentRef.current) {
      const result = await componentRef.current.assignOrder(
        "order-555",
        "store-777",
      );
      console.log("Component ref result:", result);
    }
  };

  // Callbacks للمكون
  const handleAssignmentSuccess = (
    orderId: string,
    storeId: string,
    responseData: any,
  ) => {
    console.log("✅ Assignment callback - Success:", {
      orderId,
      storeId,
      responseData,
    });

    // هنا يمكنك إ��افة المنطق عند نجاح التعيين
    // مثل: إعادة تحميل قائمة الطلبات، إظهار تنبيه، إلخ

    // مثال: إعادة تحميل البيانات
    // fetchOrders();
  };

  const handleAssignmentError = (
    orderId: string,
    storeId: string,
    errorMessage: string,
  ) => {
    console.error("❌ Assignment callback - Error:", {
      orderId,
      storeId,
      errorMessage,
    });

    // هنا يمكنك إضافة المنطق عند فشل التعيين
    // مثل: تسجيل الخطأ، إظهار تنبيه مفصل، إلخ
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>أمثلة استخدام نظام تعيين الطلبات</h1>

      {/* معلومات الحالة الحالية */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>حالة التحميل العامة</h3>
        <p>Loading: {isLoading ? "نعم" : "لا"}</p>
        <p>Error: {error || "لا يوجد"}</p>
        <p>
          Last Response:{" "}
          {lastResponse ? JSON.stringify(lastResponse, null, 2) : "لا يوجد"}
        </p>
      </div>

      {/* المثال الأول: استخدام Hook مباشرة */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>المثال 1: استخدام Hook مباشرة</h2>
        <p>استخدام useAssignOrderEdgeFunction hook في المكون</p>

        <button
          onClick={handleDirectAssignment}
          disabled={isLoading}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "جاري التعيين..." : "تعيين طلب (Hook)"}
        </button>

        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          <strong>الكود:</strong>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            {`const { assignOrder } = useAssignOrderEdgeFunction();
const result = await assignOrder('order-123', 'store-456');`}
          </pre>
        </div>
      </section>

      {/* المثال الثاني: استخدام الدالة المستقلة */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>المثال 2: استخدام الدالة المستقلة</h2>
        <p>استخدام assignOrderDirectly function بدون hooks</p>

        <button
          onClick={handleDirectFunctionCall}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          تعيين طلب (Direct Function)
        </button>

        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          <strong>الكود:</strong>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            {`import { assignOrderDirectly } from '@/hooks/useAssignOrderEdgeFunction';
const result = await assignOrderDirectly('order-789', 'store-101');`}
          </pre>
        </div>
      </section>

      {/* المثال الثالث: استخدام المكون الجاهز */}
      <section
        style={{
          marginBottom: "30px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>المثال 3: استخدام المكون الجاهز</h2>
        <p>استخدام AssignOrderComponent مع callbacks</p>

        <AssignOrderComponent
          ref={componentRef}
          onAssignmentSuccess={handleAssignmentSuccess}
          onAssignmentError={handleAssignmentError}
          showMessages={true}
        />

        <button
          onClick={handleComponentRefAssignment}
          style={{
            backgroundColor: "#6f42c1",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          تعيين عبر Component Ref
        </button>

        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          <strong>الكود:</strong>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            {`<AssignOrderComponent
  onAssignmentSuccess={(orderId, storeId, data) => {
    console.log('Success:', { orderId, storeId, data });
  }}
  onAssignmentError={(orderId, storeId, error) => {
    console.error('Error:', { orderId, storeId, error });
  }}
/>`}
          </pre>
        </div>
      </section>

      {/* نصائح الاستخدام */}
      <section
        style={{
          backgroundColor: "#e9ecef",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h3>نصائح الاستخدام</h3>
        <ul>
          <li>
            <strong>Hook:</strong> استخدم useAssignOrderEdgeFunction للمرونة
            الكاملة في المكونات
          </li>
          <li>
            <strong>Direct Function:</strong> استخدم assignOrderDirectly
            للاستدعاءات خارج React components
          </li>
          <li>
            <strong>Component:</strong> استخدم AssignOrderComponent للواجهة
            الجاهزة مع المدخلات
          </li>
          <li>
            <strong>Error Handling:</strong> تأكد من معالجة الأخطاء في جميع
            الحالات
          </li>
          <li>
            <strong>Loading State:</strong> استخدم isLoading لتحسين تجربة
            المستخدم
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AssignOrderUsageExample;

/**
 * مثال مبسط للاستخدام في أي مكون آخر
 */
export const SimpleUsageExample = () => {
  const { assignOrder, isLoading } = useAssignOrderEdgeFunction();

  const handleQuickAssign = async (orderId: string, storeId: string) => {
    const result = await assignOrder(orderId, storeId);

    if (result.success) {
      // نجح التعيين
      console.log("تم تعيين الطلب بنجاح");
    } else {
      // فشل التعيين
      console.error("فشل في تعيين الطلب:", result.error);
    }
  };

  return (
    <button
      onClick={() => handleQuickAssign("order-123", "store-456")}
      disabled={isLoading}
    >
      {isLoading ? "جاري التعيين..." : "تعيين سريع"}
    </button>
  );
};
