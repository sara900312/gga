import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrderDetails from "@/components/OrderDetails";
import {
  LogOut,
  Plus,
  Users,
  Package,
  Settings,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { ArabicText } from "@/components/ui/arabic-text";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OrderCard } from "@/components/orders/OrderCard";
import { EnhancedOrderCard } from "@/components/orders/EnhancedOrderCard";
import { Order } from "@/types/order";
import { OrderService } from "@/services/orderService";
import { formatCurrency } from "@/utils/currency";
import { deleteFakeOrders, checkForFakeOrders } from "@/utils/cleanupFakeOrders";

// Environment variable for Edge Functions base URL
const EDGE_FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_EDGE_FUNCTIONS_BASE || 'https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1';

type Order = Tables<"orders">;
type Store = Tables<"stores">;

type OrderWithProduct = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  product_name: string;
  product_price: number;
  store_name: string;
  assigned_store_name: string;
  main_store_name: string;
  created_at: string;
  order_code: string;
  order_status: string;
  assigned_store_id: string;
  total_amount: number;
  order_details: string;
  customer_notes: string;
  items: {
    name?: string;
    price?: number;
    quantity?: number;
    product_id?: number;
  }[] | null;
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStorePassword, setNewStorePassword] = useState("");
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isToggleLoading, setIsToggleLoading] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // حذف الطلبات المزيفة من قاعدة البيانات
  const handleDeleteFakeOrders = async () => {
    try {
      setIsLoading(true);

      // التحقق من وجود طلبات مزيفة أولاً
      const checkResult = await checkForFakeOrders();

      if (!checkResult.found) {
        toast({
          title: "لا توجد طلبات مزيفة",
          description: "لم يتم العثور على أي طلبات مزيفة لحذفها",
        });
        return;
      }

      console.log(`🗑️ سيتم حذف ${checkResult.count} طلب مزيف`);

      // حذف الطلبات المزيفة
      const result = await deleteFakeOrders();

      if (result.success) {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف ${checkResult.count} طلب مزيف من قاعدة البيانات`,
        });

        // إعادة تحميل الطلبات
        await fetchOrders();
      } else {
        toast({
          title: "خطأ في الحذف",
          description: result.error || "فشل في حذف الطلبات المزيفة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ خطأ في حذف الطلبات المزيفة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الطلبات المزيفة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔵 AdminDashboard useEffect started");
    console.log("🔵 Current URL:", window.location.href);
    console.log("🔵 Environment check:", {
      supabase: !!supabase,
      localStorage: !!localStorage,
      navigate: !!navigate
    });

    const adminAuth = localStorage.getItem("adminAuth");
    console.log("🔵 adminAuth from localStorage:", adminAuth);
    
    if (!adminAuth) {
      console.log("❌ No adminAuth found, redirecting to login");
      navigate("/admin-login");
      return;
    }

    console.log("✅ adminAuth found, proceeding with dashboard initialization");

    // Get current session and listen for changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("��� Current session:", session);
      setUserSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔵 Auth state changed:", event, session);
        setUserSession(session);
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem("adminAuth");
          navigate("/admin-login");
        }
      }
    );

    // Load initial data
    console.log("🔵 Starting to load initial data...");

    // حل مؤقت: إذا لم تنتهي ��ملي�� التحميل في 10 ثواني، اعتبرها منتهية
    const loadingTimeout = setTimeout(() => {
      console.warn("⚠️ Loading timeout reached, forcing isLoading to false");
      setIsLoading(false);
    }, 10000);

    Promise.all([
      fetchOrders().catch(e => console.error("❌ fetchOrders failed:", e)),
      fetchStores().catch(e => console.error("❌ fetchStores failed:", e)),
      fetchSettings().catch(e => console.error("❌ fetchSettings failed:", e))
    ]).finally(() => {
      clearTimeout(loadingTimeout);
      console.log("🔵 All initial data loading completed");
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      setIsOrdersLoading(true);
      console.log("🔵 fetchOrders started");
      console.log("🔵 Supabase client available:", !!supabase);

      const { data, error } = await supabase.rpc("get_orders_with_products");

      console.log("🔵 fetchOrders raw response:", {
        dataLength: data?.length,
        error: error,
        firstItem: data?.[0]
      });

      if (error) {
        console.error("❌ Supabase RPC error:", error);
        console.error("❌ Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // في حالة الخطأ، لا تستخدم بيانات تجريبية - أظهر قائمة فار��ة
        console.log("🔄 Database error - showing empty list");
        setOrders([]);
        return;
      }

      console.log("✅ Orders fetched successfully:", {
        count: data?.length || 0,
        sample: data?.[0],
      });

      // Process orders with currency conversion
      const processedOrders = data && data.length > 0 ? OrderService.processOrderData(data) : [];
      console.log("🔄 Orders processed:", {
        count: processedOrders.length,
        sampleProcessed: processedOrders[0]
      });

      setOrders(processedOrders);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      console.log("🔄 Error fetching orders - showing empty list");
      setOrders([]);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الطلبات",
        variant: "destructive",
      });
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      console.log("🔵 fetchStores started");
      console.log("🔵 Supabase client:", supabase ? 'available' : 'not available');

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      console.log("🔵 fetchStores raw response:", { data, error });

      if (error) {
        console.error("❌ Error fetching stores:", error);
        console.error("❌ Error details:", { message: error.message, details: error.details, hint: error.hint });
        throw error;
      }

      console.log("✅ Stores fetched successfully:", data?.length || 0, "stores");
      setStores(data || []);
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
      console.error("❌ Full error object:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      toast({
        title: "خطأ",
        description: "فشل في تحميل المتاجر",
        variant: "destructive",
      });
    } finally {
      console.log("🔵 fetchStores completed, setting isLoading to false");
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      console.log("🔵 fetchSettings started");
      const { data, error } = await supabase
        .from("settings")
        .select("auto_assign_enabled")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching settings:", error);
        throw error;
      }
      
      console.log("✅ Settings fetched:", data);
      if (data) {
        setAutoAssignEnabled(data.auto_assign_enabled);
      }
    } catch (error) {
      console.error("❌ Error fetching settings:", error);
    }
  };

  const handleAssignOrder = async (orderId: string, storeId: string) => {
    try {
      setIsAssigning(orderId);

      // �� لوغ مفصل للتأكد من القيم قبل ا��طلب
      console.log('🔵 Assign Order:', { orderId, storeId });
      console.log('📦 Sending assignment request:');
      console.log('orderId:', orderId, typeof orderId);
      console.log('storeId:', storeId, typeof storeId);
      console.log('Request body:', JSON.stringify({ orderId, storeId }));
      console.log('URL:', 'https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/assign-order');

      // تأكد من أن القيم ليست undefined
      if (!orderId || !storeId) {
        console.error('❌ Missing values:', { orderId, storeId });
        toast({
          title: "خطأ في البيانات",
          description: "معر�� الطلب أو معرف المت��ر غير صحيح",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/assign-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, storeId })
      });

      console.log('📨 Response status:', res.status, res.statusText);
      console.log('📨 Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const err = await res.json();
        console.error('🔴 Edge Function Error:', err);
        console.error('🔴 Full response:', { status: res.status, statusText: res.statusText, error: err });
        toast({
          title: "خطأ في التعيين",
          description: err.error || res.statusText || "ف����ل في تعيين الطلب",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      console.log('✅ Order assigned successfully:', data);

      if (data.success) {
        toast({ title: "تم بنجاح", description: data.message });

        // تحديث الطلب محل��اً دون ��عادة جلب كل البيانات
        setOrders(prev => prev.map(order =>
          order.order_id === orderId
            ? {
                ...order,
                order_status: 'assigned',
                assigned_store_id: storeId,
                assigned_store_name: data.store_name
              }
            : order
        ));
      } else {
        toast({
          title: "خطأ",
          description: data.error || "فشل في تعيين الطلب",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('🔴 Error in handleAssignOrder:', error);

      toast({
        title: "خطأ في الاتصال",
        description: error instanceof Error ? error.message : "فشل الاتصال بالسيرفر",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(null);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStorePassword.trim()) return;

    try {
      setIsCreatingStore(true);
      const { error } = await supabase.from("stores").insert([
        {
          name: newStoreName.trim(),
          password: newStorePassword.trim(),
        },
      ]);

      if (error) throw error;

      toast({
        title: "تم إنشاء المتجر",
        description: `تم إنشاء متجر "${newStoreName}" بنجاح`,
      });

      setNewStoreName("");
      setNewStorePassword("");
      fetchStores();
    } catch (error) {
      console.error("Error creating store:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء ا��م��جر",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStore(false);
    }
  };

  const handleToggleAutoAssign = async () => {
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون مسجل الدخول كمشرف",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsToggleLoading(true);
      const { error } = await supabase.from("settings").upsert({
        id: 1,
        auto_assign_enabled: !autoAssignEnabled,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setAutoAssignEnabled(!autoAssignEnabled);

      toast({
        title: "تم التحديث",
        description: `تم ${!autoAssignEnabled ? "��فعيل" : "��لغاء"} ال��عيين التلقائي`,
      });
    } catch (error) {
      console.error("Error updating auto-assign setting:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsToggleLoading(false);
    }
  };

  const handleAutoAssignOrders = async () => {
    try {
      setIsAutoAssigning(true);

      console.log('🔎 Calling auto-assign-orders');

      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/auto-assign-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      console.log('📨 Auto-assign response status:', res.status, res.statusText);

      if (!res.ok) {
        const errData = await res.json();
        console.error('🔴 Auto-assign Error:', errData);
        toast({
          title: "خطأ في التعيين التلقائي",
          description: errData.error || res.statusText || "فشل في التعيين التلقائي",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      console.log('✅ Auto-assign completed:', data);

      if (data.success) {
        const assignedCount = data.assigned_count || 0;
        const unmatchedCount = data.unmatched_count || 0;
        const errorCount = data.error_count || 0;

        let message = `تم تعيين ${assignedCount} طلب بنجاح`;
        if (unmatchedCount > 0) {
          message += `\n${unmatchedCount} طل�� لم يتم العثور على متجر مطابق`;
        }
        if (errorCount > 0) {
          message += `\n${errorCount} طلب حدث بهم خطأ`;
        }



        toast({
          title: "تم التعيين التلقا��ي",
          description: message,
        });

        // ��عادة تحم��ل الطلبات
        console.log('🔄 Refreshing orders after auto-assign...');
        await fetchOrders();
      } else {
        toast({
          title: "فشل في التعيين التلقائي",
          description: data.error || 'خطأ غير محدد',
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('🔴 Error in handleAutoAssignOrders:', error);

      toast({
        title: "خطأ في التعيين ا��تلقائي",
        description: error instanceof Error ? error.message : "فشل ال��تصال بالسيرفر للتعيي�� التلقائي",
        variant: "destructive",
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrderId(null);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
  };

  const handleLogout = async () => {
    localStorage.removeItem("adminAuth");
    await supabase.auth.signOut();
    navigate("/admin-login");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: "معلقة",
        message: "⏳ في الانتظار: لم يتم تعيين ه��ا الطلب لأي متجر ب��د.",
        variant: "secondary" as const,
        icon: Clock,
      },
      assigned: {
        label: "���عين��",
        message: "📦 الطلب معين إلى المتجر، جاري ال����الجة.",
        variant: "default" as const,
        icon: Package,
      },
      delivered: {
        label: "مسلمة",
        message: "✅ تم ��سليم الطلب بنجاح.",
        variant: "default" as const,
        icon: CheckCircle,
      },
      completed: {
        label: "مسلمة",
        message: "✅ تم تسليم الطلب ب��جاح.",
        variant: "default" as const,
        icon: CheckCircle,
      },
      returned: {
        label: "مرتجعة",
        message: "🔄 تم إرجاع الطلب.",
        variant: "destructive" as const,
        icon: XCircle,
      },
    };

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        message: `⚠️ حالة غير معروفة: ${status}`,
        variant: "secondary" as const,
        icon: Package,
      }
    );
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.order_status === status);
  };

  // Convert OrderWithProduct to Order type for new components
  const convertToOrder = (order: OrderWithProduct): Order => {
    const baseOrder = {
      id: order.order_id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      customer_city: order.customer_city,
      customer_notes: order.customer_notes,
      order_status: order.order_status as Order['order_status'],
      assigned_store_id: order.assigned_store_id,
      assigned_store_name: order.assigned_store_name,
      main_store_name: order.main_store_name,
      items: order.items,
      total_amount: order.total_amount,
      created_at: order.created_at
    };

    // Apply currency conversion through OrderService
    return OrderService.normalizeOrderAmounts(baseOrder);
  };

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((order) => order.order_status === "pending")
        .length,
      assigned: orders.filter((order) => order.order_status === "assigned")
        .length,
      delivered: orders.filter((order) => order.order_status === "delivered")
        .length,
      returned: orders.filter((order) => order.order_status === "returned")
        .length,
    };
  };

  const renderOrderCard = (order: OrderWithProduct) => {
    const convertedOrder = convertToOrder(order);

    return (
      <ErrorBoundary key={order.order_id}>
        <EnhancedOrderCard
          order={convertedOrder}
          onViewDetails={(orderId) => handleViewOrder(orderId)}
          onAssign={async (orderId, storeId) => {
            await handleAssignOrder(orderId, storeId);
          }}
          showAssignButton={order.order_status === "pending"}
          compact={false}
        />
      </ErrorBoundary>
    );
  };

  const renderOrderCardOld = (order: OrderWithProduct) => (
    <div
      key={order.order_id}
      className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-4 lg:p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow gap-4"
    >
      <div className="flex-1">
        <div className="bg-card border rounded-lg p-4 flex flex-col">
          {/* رأس الطلب */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 pb-3 border-b gap-2">
            <h3 className="font-bold text-lg text-primary">
              طلب #{order.order_code || order.order_id.slice(0, 8)}
            </h3>
            <div className="flex items-center gap-2">
              <Badge {...getStatusBadge(order.order_status || "pending")}>
                {getStatusBadge(order.order_status || "pending").label}
              </Badge>
            </div>
          </div>

          {/* م��لوما�� مختص��ة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[80px]">👤 العميل:</span>
                <span className="font-medium">{order.customer_name || "غير محدد"}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 min-w-[80px]">📞 الهاتف:</span>
                <span className="font-medium" dir="ltr">{order.customer_phone || "غير محدد"}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-indigo-600 min-w-[80px]">📍 العنوان:</span>
                <span className="font-medium">{order.customer_address || "غير محدد"}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-pink-600 min-w-[80px]">📝 ملاحظات:</span>
                <span className="font-medium">{order.customer_notes || "لا توجد"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600 min-w-[80px]">💰 ا���مبلغ:</span>
                <span className="text-green-700 font-bold">
                  {order.total_amount ? formatCurrency(order.total_amount) : "غير محدد"}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-600 min-w-[80px]">🏪 المتجر الرئيسي:</span>
                <span className="font-medium text-blue-600">
                  {order.main_store_name || "غير محدد"}
                </span>
              </div>

              {order.assigned_store_name && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-green-600 min-w-[80px]">🎯 المتجر المعين:</span>
                  <span className="font-medium text-green-600">
                    {order.assigned_store_name}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-600 min-w-[80px]">🆔 الطلب:</span>
                <span className="font-medium">{order.order_code || "غير مح��د"}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-600 min-w-[80px]">📅 التاريخ:</span>
                <span className="font-medium">
                  {new Date(order.created_at).toLocaleString("ar-EG", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* حالة الطلب */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">📊 حالة الطل��:</h4>
            <div className="flex items-center gap-2">
              <span className="font-medium">{getStatusBadge(order.order_status || "pending").label}</span>
              <span className="text-sm text-muted-foreground">
                {getStatusBadge(order.order_status || "pending").message}
              </span>
            </div>
          </div>

          {/* عناصر الطلب - تفاصيل المنتجات */}
          {order.items && order.items.length > 0 ? (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-3 text-blue-700">
                منتجات الطلب ({order.items.length} منتج)
              </h4>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-800 mb-1">
                          {item.name || 'منتج غير محدد'}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="font-medium">
                            السعر: {item.price ? formatCurrency(item.price) : 'غير محدد'}
                          </div>
                          <div className="font-medium">
                            الكمية: {item.quantity || 1}
                          </div>
                          {item.description && (
                            <div className="text-gray-500 italic">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-green-700">
                        {item.price && item.quantity
                          ? formatCurrency(item.price * item.quantity)
                          : 'غير محدد'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">إجمالي الطلب:</span>
                  <span className="font-bold text-lg text-green-700">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-700 font-medium">تفاصيل المنتجات غير متاح��</p>
                </div>
                <p className="text-xs text-yellow-600">لعرض تفاصيل المنتجات انقر على زر "تفاصيل" لفتح نافذة التفاصيل الك���ملة</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewOrder(order.order_id)}
                  className="mt-2 text-xs"
                >
                  👁�� ��رض تفاصيل المنتجات
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {order.order_status === "pending" && (
        <div className="w-full lg:w-auto lg:mr-4 flex flex-col items-stretch lg:items-center gap-2 lg:min-w-[160px]">
          <div className="text-xs text-muted-foreground font-medium text-center">
            تعيين إل�� متجر
          </div>
          <Select
            onValueChange={(storeId) =>
              handleAssignOrder(order.order_id, storeId)
            }
            disabled={isAssigning === order.order_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                isAssigning === order.order_id ? "جار�� التعيين..." : "اختر متجر"
              } />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    console.log("🔵 Showing loading screen, isLoading =", isLoading);
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="text-lg">جاري التحميل...</div>
        <div className="text-sm text-muted-foreground">
          جا��ي ت��ميل البيانات، يرجى المراجعة في وحدة تحكم المطور (F12) للمزيد من ��لتفاصيل
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6 arabic-text"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              <ArabicText>لوحة إدارة الطلبات</ArabicText>
            </h1>
            <p className="text-muted-foreground">
              <ArabicText>إدارة الطلبات والمتاجر</ArabicText>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-muted-foreground">
                    <ArabicText>إجمالي الطلبات</ArabicText>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-muted-foreground">
                    <ArabicText>طلبات معلقة</ArabicText>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.assigned}</p>
                  <p className="text-muted-foreground">طلبات معينة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                  <p className="text-muted-foreground">طلبات مسلمة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.returned}</p>
                  <p className="text-muted-foreground">طلبات مرتجعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings & Create Store */}
          <div className="space-y-6">
            {/* Auto Assignment Setting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  إعدادات التعيين التلقائي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAssign">تعيين تلقائي للطلبات</Label>
                    <p className="text-sm text-muted-foreground">
                      تعيين الطلبات تلقائياً حسب اسم الم��جر الرئيسي
                    </p>
                    {isToggleLoading && (
                      <p className="text-xs text-primary">
                        جاري التحد��ث...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isToggleLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    <Switch
                      id="autoAssign"
                      checked={autoAssignEnabled}
                      onCheckedChange={handleToggleAutoAssign}
                      disabled={isToggleLoading}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t text-xs text-muted-foreground">
                  تعيين جميع الطلبات المعلقة تلقائياً للمتاجر المناسبة
                </div>
              </CardContent>
            </Card>

            {/* Create Store */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إنشاء متجر جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">اسم المتجر</Label>
                    <Input
                      id="storeName"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      placeholder="أدخل اسم المتجر"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="storePassword"
                      className="flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      كلمة المرور
                    </Label>
                    <Input
                      id="storePassword"
                      type="password"
                      value={newStorePassword}
                      onChange={(e) => setNewStorePassword(e.target.value)}
                      placeholder="أدخ�� كلمة المرور"
                      className="text-right"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreatingStore || !newStoreName.trim() || !newStorePassword.trim()}
                  >
                    {isCreatingStore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري إن����اء المتجر...
                      </>
                    ) : (
                      'إنشاء المتجر'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Orders List with Tabs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>قائمة الطلبات</CardTitle>
              <CardDescription>
                جميع الطلبات الواردة من العملاء مجموعة حسب الحالة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="pending">
                    معلقة ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="assigned">
                    معينة ({stats.assigned})
                  </TabsTrigger>
                  <TabsTrigger value="delivered">
                    مسلمة ({stats.delivered})
                  </TabsTrigger>
                  <TabsTrigger value="returned">
                    مرتجعة ({stats.returned})
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="pending"
                  className="space-y-4 max-h-96 overflow-y-auto"
                >
                  {isOrdersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      جاري تحميل الطلبات...
                    </div>
                  ) : (
                    <>
                      {getOrdersByStatus("pending").map(renderOrderCard)}
                      {getOrdersByStatus("pending").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات معلقة
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent
                  value="assigned"
                  className="space-y-4 max-h-96 overflow-y-auto"
                >
                  {isOrdersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      جا��ي تحميل ا��طلبات...
                    </div>
                  ) : (
                    <>
                      {getOrdersByStatus("assigned").map(renderOrderCard)}
                      {getOrdersByStatus("assigned").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات معينة
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent
                  value="delivered"
                  className="space-y-4 max-h-96 overflow-y-auto"
                >
                  {isOrdersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      جاري تحميل الطلبات...
                    </div>
                  ) : (
                    <>
                      {getOrdersByStatus("delivered").map(renderOrderCard)}
                      {getOrdersByStatus("delivered").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد ��لبات مسلمة
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent
                  value="returned"
                  className="space-y-4 max-h-96 overflow-y-auto"
                >
                  {isOrdersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      جاري تح����ل الطلبات...
                    </div>
                  ) : (
                    <>
                      {getOrdersByStatus("returned").map(renderOrderCard)}
                      {getOrdersByStatus("returned").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد طلبا�� مرتجعة
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          {selectedOrderId && (
            <OrderDetails
              orderId={selectedOrderId}
              stores={stores}
              onOrderUpdated={handleOrderUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
