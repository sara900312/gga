import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrderDetails from "@/components/OrderDetails";
import { EnhancedOrderCard } from "@/components/orders/EnhancedOrderCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ArabicText } from "@/components/ui/arabic-text";
import {
  LogOut,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { formatCurrency } from "@/utils/currency";

type OrderWithProduct = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  product_name: string;
  product_price: number;
  assigned_store_name: string;
  created_at: string;
  order_code: string;
  order_status: string;
  assigned_store_id: string;
  total_amount: number;
  customer_notes: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    product_id: number;
  }[];
};

const StoreDashboard = () => {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [storeInfo, setStoreInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("🔵 StoreDashboard: Checking authentication...");
    const storeAuth = localStorage.getItem("storeAuth");

    if (!storeAuth) {
      console.log("❌ No storeAuth found, redirecting to login...");
      navigate("/store-login-space9003", { replace: true });
      return;
    }

    try {
      const store = JSON.parse(storeAuth);
      console.log("✅ Store authenticated:", store);
      setStoreInfo(store);
      fetchOrders(store.id);
    } catch (error) {
      console.error("❌ Error parsing storeAuth:", error);
      localStorage.removeItem("storeAuth");
      navigate("/store-login-space9003", { replace: true });
    }
  }, [navigate]);

  const fetchOrders = async (storeId: string, showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Query orders directly from the orders table with proper filtering
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          customer_name,
          customer_phone,
          customer_address,
          customer_city,
          items,
          total_amount,
          customer_notes,
          order_code,
          order_status,
          status,
          assigned_store_id,
          created_at,
          stores!assigned_store_id(name)
        `,
        )
        .eq("assigned_store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedOrders: OrderWithProduct[] =
        data?.map((order) => ({
          order_id: order.id,
          customer_name: order.customer_name || "",
          customer_phone: order.customer_phone || "",
          customer_address: order.customer_address || "",
          customer_city: order.customer_city || "",
          product_name:
            order.items && Array.isArray(order.items) && order.items.length > 0
              ? order.items[0]?.name || "غير محدد"
              : "غير محدد",
          product_price:
            order.items && Array.isArray(order.items) && order.items.length > 0
              ? order.items[0]?.price || 0
              : 0,
          assigned_store_name: order.stores?.name || "غير معين",
          created_at: order.created_at,
          order_code: order.order_code || "",
          order_status: order.order_status || order.status || "pending",
          assigned_store_id: order.assigned_store_id || "",
          total_amount: order.total_amount || 0,
          customer_notes: order.customer_notes || "",
          items:
            order.items && Array.isArray(order.items)
              ? order.items.map((item: any) => ({
                  name: item.name || "",
                  price: item.price || 0,
                  quantity: item.quantity || 1,
                  product_id: item.product_id || 0,
                }))
              : [],
        })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      const errorMessage = "فشل في تحميل الطلبات. يرجى المحاولة مرة أخر��.";
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: newStatus,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });

      fetchOrders(storeInfo!.id, false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("storeAuth");
    navigate("/store-login-space9003");
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
    if (storeInfo?.id) {
      fetchOrders(storeInfo.id, false);
    }
  };

  const handleRefreshOrders = () => {
    if (storeInfo?.id) {
      fetchOrders(storeInfo.id, false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: "معلقة",
        message: "⏳ في الانتظار: لم يتم تعيين هذا الطلب لأي متجر بعد.",
        variant: "secondary" as const,
        icon: Clock,
      },
      assigned: {
        label: "معينة",
        message: "📦 الطلب معين إل�� المتجر، جاري المعالجة.",
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
        label: "مس��مة",
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

  const getStatusStats = () => {
    const stats = {
      total: orders.length,
      assigned: orders.filter((order) => order.order_status === "assigned")
        .length,
      delivered: orders.filter((order) => order.order_status === "delivered")
        .length,
      returned: orders.filter((order) => order.order_status === "returned")
        .length,
    };
    return stats;
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.order_status === status);
  };

  const renderOrderCard = (order: OrderWithProduct) => {
    const statusInfo = getStatusBadge(order.order_status || "assigned");
    const StatusIcon = statusInfo.icon;

    return (
      <div
        key={order.order_id}
        className="p-4 md:p-6 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatusIcon className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">{order.customer_name}</h3>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewOrder(order.order_id)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                تفاصيل
              </Button>
              <Select
                value={order.order_status || "assigned"}
                onValueChange={(newStatus) =>
                  handleStatusUpdate(order.order_id, newStatus)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">معينة</SelectItem>
                  <SelectItem value="delivered">مسلمة</SelectItem>
                  <SelectItem value="returned">مرتجعة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Message */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium text-primary">
              {statusInfo.message}
            </p>
          </div>

          {/* Customer Details */}
          <div className="space-y-3 text-sm bg-muted/30 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="font-semibold">🆔 كود الطلب:</span>
              <span>{order.order_code || "غير محدد"}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">👤 اسم العميل:</span>
              <span>{order.customer_name || "غير محدد"}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">📞 رقم الهاتف:</span>
              <span>{order.customer_phone || "غير محدد"}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">📅 تاريخ الطلب:</span>
              <span>
                {new Date(order.created_at).toLocaleDateString("ar-EG", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">📍 عنوان العميل:</span>
              <span>{order.customer_address || "غير محدد"}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">📝 ملاحظات العميل:</span>
              <span>{order.customer_notes || "لا توجد ملاحظات"}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">🏪 المتجر المعين:</span>
              <span className="text-blue-600 font-medium">
                {order.assigned_store_name || "غير معين"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-semibold">💰 المبلغ الإجمالي:</span>
              <span className="text-green-600 font-medium">
                {order.total_amount ? formatCurrency(order.total_amount) : "غير محدد"}
              </span>
            </div>
          </div>

          {/* عناصر الطلب */}
          {order.items && order.items.length > 0 ? (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">🛍️ عناصر الطلب:</h4>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="border rounded p-2 text-xs bg-gray-50">
                    🛍️ {item.name || 'غير محدد'} - {item.quantity || 1} × {formatCurrency(item.price || 0)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">لا توجد عناصر</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="w-6 h-6 animate-spin" />
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-destructive mb-4">{error}</div>
          <Button onClick={() => fetchOrders(storeInfo?.id || "")}>
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              متجر {storeInfo?.name}
            </h1>
            <p className="text-muted-foreground">لوحة تحكم الطلبات</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefreshOrders}
              variant="outline"
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  تحديث
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-muted-foreground">إجمالي الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-blue-600" />
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

        {/* Orders List with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>��لباتك</CardTitle>
            <CardDescription>
              جميع الطلبات المعينة لمتجرك مجمعة حسب الحالة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assigned" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assigned">
                  📌 معينة ({stats.assigned})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  ✅ مسلمة ({stats.delivered})
                </TabsTrigger>
                <TabsTrigger value="returned">
                  🔁 مرتجعة ({stats.returned})
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="assigned"
                className="space-y-4 max-h-96 overflow-y-auto"
              >
                {getOrdersByStatus("assigned").map((order) =>
                  renderOrderCard(order),
                )}
                {getOrdersByStatus("assigned").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا تو��د طلبات معينة
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="delivered"
                className="space-y-4 max-h-96 overflow-y-auto"
              >
                {getOrdersByStatus("delivered").map((order) =>
                  renderOrderCard(order),
                )}
                {getOrdersByStatus("delivered").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات مسلمة
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="returned"
                className="space-y-4 max-h-96 overflow-y-auto"
              >
                {getOrdersByStatus("returned").map((order) =>
                  renderOrderCard(order),
                )}
                {getOrdersByStatus("returned").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات مرتجعة
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
              stores={[]} // Store dashboard doesn't need store assignment functionality
              onOrderUpdated={handleOrderUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreDashboard;
