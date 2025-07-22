/**
 * 🧪 مكون تجريبي لاختبار Edge Functions
 * يوضح كيفية استخدام الدوال الجديدة بدون Authorization headers
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  callGetOrder, 
  callAssignOrder, 
  callAutoAssignOrders,
  handleEdgeFunctionError 
} from '@/utils/edgeFunctionsExamples';
import { Loader2, CheckCircle, XCircle, Zap, Package, Users } from 'lucide-react';

const EdgeFunctionsTestComponent = () => {
  // حالات التحميل
  const [isLoadingGetOrder, setIsLoadingGetOrder] = useState(false);
  const [isLoadingAssignOrder, setIsLoadingAssignOrder] = useState(false);
  const [isLoadingAutoAssign, setIsLoadingAutoAssign] = useState(false);
  
  // البيانات
  const [orderData, setOrderData] = useState<any>(null);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [autoAssignResult, setAutoAssignResult] = useState<any>(null);
  
  // المدخلات
  const [orderId, setOrderId] = useState('');
  const [storeId, setStoreId] = useState('');
  
  const { toast } = useToast();

  // 1️⃣ اختبار get-order
  const handleTestGetOrder = async () => {
    if (!orderId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال معرف الطلب",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingGetOrder(true);
    setOrderData(null);
    
    try {
      console.log("🔵 Testing get-order...");
      const order = await callGetOrder(orderId.trim());
      setOrderData(order);
      
      toast({
        title: "✅ نجح get-order",
        description: `تم ��لب بيانات الطلب: ${order.customer_name}`,
      });
    } catch (error) {
      const errorMessage = handleEdgeFunctionError(error, 'get-order');
      toast({
        title: "❌ فشل get-order",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingGetOrder(false);
    }
  };

  // 2️⃣ اختبار assign-order
  const handleTestAssignOrder = async () => {
    if (!orderId.trim() || !storeId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال معرف الطلب ومعرف المتجر",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAssignOrder(true);
    setAssignResult(null);
    
    try {
      console.log("🔵 Testing assign-order...");
      const result = await callAssignOrder(orderId.trim(), storeId.trim());
      setAssignResult(result);
      
      toast({
        title: "✅ نجح assign-order",
        description: result.message,
      });
    } catch (error) {
      const errorMessage = handleEdgeFunctionError(error, 'assign-order');
      toast({
        title: "❌ فشل assign-order",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingAssignOrder(false);
    }
  };

  // 3️⃣ اختبار auto-assign-orders
  const handleTestAutoAssign = async () => {
    setIsLoadingAutoAssign(true);
    setAutoAssignResult(null);
    
    try {
      console.log("🔵 Testing auto-assign-orders...");
      const result = await callAutoAssignOrders();
      setAutoAssignResult(result);
      
      toast({
        title: "✅ نجح auto-assign-orders",
        description: result.message,
      });
    } catch (error) {
      const errorMessage = handleEdgeFunctionError(error, 'auto-assign-orders');
      toast({
        title: "❌ فشل auto-assign-orders",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingAutoAssign(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 اختبار Edge Functions</h1>
        <p className="text-muted-foreground">
          اختبار الدوال باستخدام fetch عادي بدون Authorization headers
        </p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ تم الحل:</strong> استبدال supabase.functions.invoke() بـ fetch عادي لحل مشاكل "Failed to fetch"
          <br />
          <strong>🔧 التحديث:</strong> إزالة Authorization headers لتجنب التعارض مع Service Role Key
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1️⃣ اختبار get-order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              1️⃣ get-order
            </CardTitle>
            <CardDescription>
              جلب تفاصيل طلب معين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="معرف الطلب"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="text-right"
            />
            <Button 
              onClick={handleTestGetOrder}
              disabled={isLoadingGetOrder}
              className="w-full"
            >
              {isLoadingGetOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الجلب...
                </>
              ) : (
                'اختبار get-order'
              )}
            </Button>
            
            {orderData && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>✅ نجح:</strong> العميل: {orderData.customer_name}
                  <br />المبلغ: {orderData.total_amount} ريال
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 2️⃣ اختبار assign-order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              2️⃣ assign-order
            </CardTitle>
            <CardDescription>
              تعيين طلب لمتجر معين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="معرف الطلب"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="text-right"
            />
            <Input
              placeholder="معرف المتجر"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="text-right"
            />
            <Button 
              onClick={handleTestAssignOrder}
              disabled={isLoadingAssignOrder}
              className="w-full"
            >
              {isLoadingAssignOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري التعيين...
                </>
              ) : (
                'اختبار assign-order'
              )}
            </Button>
            
            {assignResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>✅ نجح:</strong> {assignResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 3️⃣ اختبار auto-assign-orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              3️⃣ auto-assign-orders
            </CardTitle>
            <CardDescription>
              تعيين تلقائي لجميع الطلبات المعلقة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              لا يحتاج باراميترات - يعمل تلقائياً
            </p>
            <Button 
              onClick={handleTestAutoAssign}
              disabled={isLoadingAutoAssign}
              className="w-full"
            >
              {isLoadingAutoAssign ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري التعيين التلقائي...
                </>
              ) : (
                'اختبار auto-assign-orders'
              )}
            </Button>
            
            {autoAssignResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>✅ نجح:</strong>
                  <br />تم تعيين: {autoAssignResult.assigned_count} طلب
                  <br />غير مطابق: {autoAssignResult.unmatched_count} طلب
                  <br />أخطاء: {autoAssignResult.error_count} طلب
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* عرض JSON للنتائج */}
      {(orderData || assignResult || autoAssignResult) && (
        <Card>
          <CardHeader>
            <CardTitle>📋 النتائج التفصيلية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {orderData && (
                <div>
                  <h4 className="font-semibold mb-2">get-order Result:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(orderData, null, 2)}
                  </pre>
                </div>
              )}
              
              {assignResult && (
                <div>
                  <h4 className="font-semibold mb-2">assign-order Result:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(assignResult, null, 2)}
                  </pre>
                </div>
              )}
              
              {autoAssignResult && (
                <div>
                  <h4 className="font-semibold mb-2">auto-assign-orders Result:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(autoAssignResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>📋 معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>🌐 URLs:</strong>
              <ul className="list-disc list-inside text-xs mt-1">
                <li>get-order</li>
                <li>assign-order</li> 
                <li>auto-assign-orders</li>
              </ul>
            </div>
            <div>
              <strong>📦 Headers:</strong>
              <pre className="text-xs bg-gray-100 p-1 rounded mt-1">
{`{
  'Content-Type': 'application/json'
}`}
              </pre>
            </div>
            <div>
              <strong>🔧 Method:</strong>
              <p className="text-xs mt-1">POST for all functions</p>
              <strong>🚫 No Authorization:</strong>
              <p className="text-xs">Service Role Key used internally</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionsTestComponent;
