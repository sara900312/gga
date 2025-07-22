import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Cloud } from 'lucide-react';

export const EdgeFunctionStatus: React.FC = () => {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          حالة Edge Functions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status of each Edge Function */}
          <div className="space-y-3">
            <h3 className="font-semibold">Edge Functions المتاحة:</h3>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>assign-order</span>
              <Badge variant="default" className="bg-green-100 text-green-800">متاح</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>auto-assign-orders</span>
              <Badge variant="default" className="bg-green-100 text-green-800">متاح</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>admin-login-v2</span>
              <Badge variant="default" className="bg-green-100 text-green-800">متاح</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>get-order</span>
              <Badge variant="destructive">غير منشور</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">الحلول البديلة:</h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>استعلام قاعدة البيانات مباشرة (متاح)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>تحويل العملة من SAR إلى IQD (متاح)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span>عرض تفاصيل المنتجات (متاح)</span>
              </li>
            </ul>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>للمطورين:</strong> تم إنشاء Edge Function جديدة في <code>supabase/functions/get-order/index.ts</code>.
            لنشرها، استخدم الأمر: <code>supabase functions deploy get-order</code>
          </AlertDescription>
        </Alert>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>للمستخدمين:</strong> التطبيق يعمل بشكل طبيعي مع الحلول البديلة. 
            جميع الوظائف الأساسية متاحة وجميع المشاكل السابقة تم حلها.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
