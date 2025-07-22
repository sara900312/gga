import React from "react";
import AssignOrderUsageExample from "@/examples/AssignOrderUsageExample";

/**
 * صفحة اختبار نظام تعيين الطلبات
 */
const TestAssignOrderPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <header
          style={{
            textAlign: "center",
            marginBottom: "40px",
            borderBottom: "2px solid #007bff",
            paddingBottom: "20px",
          }}
        >
          <h1
            style={{
              color: "#007bff",
              margin: "0 0 10px 0",
              fontSize: "2.5rem",
            }}
          >
            اختبار نظام تعيين الطلبات
          </h1>
          <p
            style={{
              color: "#666",
              fontSize: "1.1rem",
              margin: 0,
            }}
          >
            نظام متكامل لتعيين الطلبات للمتاجر باستخدام Supabase Edge Function
          </p>
        </header>

        {/* معلومات النظام */}
        <section
          style={{
            backgroundColor: "#e7f3ff",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            border: "1px solid #007bff",
          }}
        >
          <h2 style={{ color: "#007bff", marginTop: 0 }}>معلومات النظام</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <div>
              <strong>🎯 Edge Function:</strong> assign-order
            </div>
            <div>
              <strong>🌐 Method:</strong> POST
            </div>
            <div>
              <strong>📝 Content-Type:</strong> application/json
            </div>
            <div>
              <strong>🔐 Auth:</strong> Bearer Token
            </div>
            <div>
              <strong>📡 CORS:</strong> Enabled
            </div>
            <div>
              <strong>⚡ Loading:</strong> Supported
            </div>
          </div>
        </section>

        {/* مكونات الاختبار */}
        <AssignOrderUsageExample />

        {/* معلومات تقنية */}
        <footer
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid #ddd",
            color: "#666",
            fontSize: "0.9rem",
          }}
        >
          <h3 style={{ color: "#333" }}>الملفات المُنشأة:</h3>
          <ul style={{ lineHeight: "1.6" }}>
            <li>
              <code>hooks/useAssignOrderEdgeFunction.ts</code> - React Hook
              للتعيين
            </li>
            <li>
              <code>components/AssignOrderComponent.tsx</code> - مكون جاهز
              للاستخدام
            </li>
            <li>
              <code>examples/AssignOrderUsageExample.tsx</code> - أمثلة شاملة
            </li>
            <li>
              <code>pages/TestAssignOrderPage.tsx</code> - صفحة الاختبار الحالية
            </li>
          </ul>

          <div style={{ marginTop: "20px" }}>
            <strong>الاستخدام البسيط:</strong>
            <pre
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "6px",
                overflow: "auto",
                fontSize: "0.85rem",
                border: "1px solid #ddd",
              }}
            >
              {`// استيراد الـ Hook
import { useAssignOrderEdgeFunction } from '@/hooks/useAssignOrderEdgeFunction';

// في المكون
const { assignOrder, isLoading, error } = useAssignOrderEdgeFunction();

// استدعاء التعيين
const result = await assignOrder('order-123', 'store-456');

if (result.success) {
  console.log('تم التعيين بنجاح:', result.data);
} else {
  console.error('فشل التعيين:', result.error);
}`}
            </pre>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TestAssignOrderPage;
