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
import { useEdgeFunctions } from "@/hooks/useEdgeFunctions";
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
  Eye,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatCurrency } from "@/utils/currency";

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
  const [userSession, setUserSession] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { autoAssignOrders, isAutoAssigning } = useEdgeFunctions();

  useEffect(() => {
    console.log("🔵 AdminDashboard useEffect started");
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
      console.log("🔵 Current session:", session);
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
    fetchOrders();
    fetchStores();
    fetchSettings();

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      setIsOrdersLoading(true);
      console.log("🔵 fetchOrders started");
      
      const { data, error } = await supabase.rpc("get_orders_with_products");

      console.log("🔵 Raw response:", { data, error });

      if (error) {
        console.error("❌ Supabase RPC error:", error);
        throw error;
      }

      console.log("✅ Orders fetched successfully:", {
        count: data?.length || 0,
        sample: data?.[0],
      });

      setOrders(data || []);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
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
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) {
        console.error("❌ Error fetching stores:", error);
        throw error;
      }
      
      console.log("✅ Stores fetched successfully:", data?.length || 0, "stores");
      setStores(data || []);
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
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
      console.log("🔄 Assigning order:", { orderId, storeId });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        throw new Error("فشل في التحقق من صلاحية المستخدم");
      }

      const edgeFunctionUrl =
        "https://wkzjovhlljeaqzoytpeb.supabase.co/functions/v1/assign-order";
      const requestBody = JSON.stringify({ orderId, storeId });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
        console.log("✅ Added Bearer token to request");
      }

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers,
        body: requestBody,
      });

      console.log("📨 Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.warn("⚠️ Could not parse error response as JSON");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (data.success) {
        console.log("✅ Assignment successful");

        toast({
          title: "تم بنجاح",
          description: data.message || "تم تعيين الطلب للمتجر",
        });

        console.log("🔄 Refreshing orders after assignment...");
        await fetchOrders();
        console.log("✅ Orders refreshed successfully");
      } else {
        const errorMsg = data.error || "فشل في تعيين الطلب";
        console.error("❌ Assignment failed:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error in handleAssignOrder:", error);
      const errorMessage =
        error instanceof Error ? error.message : "فشل في تعيين الطلب";

      toast({
        title: "خطأ",
        description: errorMessage,
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
        description: "فشل في إنشاء المتجر",
        variant: "destructive",
      });
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
        description: `تم ${!autoAssignEnabled ? "تفعيل" : "إلغاء"} التعيين التلقائي`,
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
    const success = await autoAssignOrders();
    if (success) {
      await fetchOrders();
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
        message: "⏳ ��ي الانتظار: لم يتم تعيين هذا الطلب لأي متجر بعد.",
        variant: "secondary" as const,
        icon: Clock,
      },
      assigned: {
        label: "معينة",
        message: "📦 الطلب معين إلى المتجر، جاري المعالجة.",
        variant: "default" as const,
        icon: Package,
      },
      delivered: {
        label: "مسلمة",
        message: "✅ تم تسليم الطلب بنجاح.",
        variant: "default" as const,
        icon: CheckCircle,
      },
      completed: {
        label: "مسلمة",
        message: "✅ تم تسليم الطلب بنجاح.",
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

  const renderOrderCard = (order: OrderWithProduct) => (
    <div
      key={order.order_id}
      className="flex items-start justify-between p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex-1">
        <div className="bg-card border rounded-lg p-4 flex flex-col">
          {/* رأس الطلب */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b">
            <h3 className="font-bold text-lg text-primary">
              طلب #{order.order_code || order.order_id.slice(0, 8)}
            </h3>
            <div className="flex items-center gap-2">
              <Badge {...getStatusBadge(order.order_status || "pending")}>
                {getStatusBadge(order.order_status || "pending").label}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewOrder(order.order_id)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                تفاصيل
              </Button>
            </div>
          </div>

          {/* معلومات مختصرة */}
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
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600 min-w-[80px]">💰 المبلغ:</span>
                <span className="text-green-700 font-bold">
                  {order.total_amount ? formatCurrency(order.total_amount) : "غير محدد"}
                </span>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-semibold text-purple-600 min-w-[80px]">🏪 المتجر:</span>
                <span className="font-medium text-blue-600">
                  {order.main_store_name || "غير محدد"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {order.order_status === "pending" && (
        <div className="mr-4 flex flex-col items-center gap-2 min-w-[160px]">
          <div className="text-xs text-muted-foreground font-medium text-center">
            تعيين إلى متجر
          </div>
          <Select
            onValueChange={(storeId) =>
              handleAssignOrder(order.order_id, storeId)
            }
            disabled={isAssigning === order.order_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                isAssigning === order.order_id ? "جاري التعيين..." : "اختر متجر"
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
          جاري تحميل البيانات، يرجى المراجعة في وحدة تحكم المطور (F12) للمزيد من التفاصيل
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
              لوحة إدارة الطلبات
            </h1>
            <p className="text-muted-foreground">إدارة الطلبات والمتاجر</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleAutoAssignOrders} 
              disabled={isAutoAssigning}
              className="flex items-center gap-2"
            >
              {isAutoAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري التعيين التلقائي...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  تعيين تلقائي للطلبات
                </>
              )}
            </Button>
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
                  <p className="text-muted-foreground">إجم��لي الطلبات</p>
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
                  <p className="text-muted-foreground">طلبات معلقة</p>
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
                      تعيين الطلبات تلقائياً حسب اسم المتجر الرئيسي
                    </p>
                    {isToggleLoading && (
                      <p className="text-xs text-primary">
                        جاري التحديث...
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
                      placeholder="أدخل كلمة المرور"
                      className="text-right"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    إنشاء المتجر
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
                جميع الطلبات الواردة من العملاء مجمعة حسب الحالة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
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
                      جاري تحميل الطلبات...
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
                          لا توجد طلبات مسلمة
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
                      جاري تحميل الطلبات...
                    </div>
                  ) : (
                    <>
                      {getOrdersByStatus("returned").map(renderOrderCard)}
                      {getOrdersByStatus("returned").length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات مرتجعة
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
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
