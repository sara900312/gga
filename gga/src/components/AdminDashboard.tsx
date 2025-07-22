import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/currencyUtils';
import OrderCard from '@/components/OrderCard';
import OrderDetails from '@/components/OrderDetails';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, Plus, Users, Settings, RefreshCw, 
  Search, Filter, TrendingUp, ShoppingCart, CheckCircle2, Clock
} from 'lucide-react';

interface ProductItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  store?: string;
}

interface Order {
  id: string;
  order_code?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  main_store_name?: string;
  assigned_store_name?: string;
  customer_notes?: string;
  items: ProductItem[];
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });

  // بيانات تجريبية مع تفاصيل منتجات حقيقية بأسعار 399 د.ع
  const createMockOrders = (): Order[] => {
    return [
      {
        id: '1',
        order_code: 'ORD-2024-001',
        customer_name: 'أحمد محمد علي',
        customer_phone: '+964 770 123 4567',
        customer_address: 'بغداد - الكرادة - شارع الرئيسي، البناية رقم 15',
        order_status: 'assigned',
        total_amount: 10399,
        created_at: new Date().toISOString(),
        main_store_name: 'متجر التكنولوجيا الحديثة',
        assigned_store_name: 'فرع بغداد الرئيسي',
        customer_notes: 'يرجى التوصيل بعد العصر، الطابق الثالث',
        items: [
          {
            id: 1,
            name: 'هاتف ذكي Samsung Galaxy A54',
            price: 8999,
            quantity: 1,
            category: 'الكترونيات',
            store: 'متجر التكنولوجيا'
          },
          {
            id: 2,
            name: 'سماعات لاسلكية AirPods',
            price: 1400,
            quantity: 1,
            category: 'اكسسوارات',
            store: 'متجر التكنولوجيا'
          }
        ]
      },
      {
        id: '2',
        order_code: 'ORD-2024-002',
        customer_name: 'فاطمة عبد الرحمن',
        customer_phone: '+964 771 987 6543',
        customer_address: 'البصرة - المعقل - حي السلام، الشارع الأول',
        order_status: 'pending',
        total_amount: 2199,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        main_store_name: 'متجر الأزياء النسائية',
        customer_notes: 'المقاس M، اللون الأزرق المفضل',
        items: [
          {
            id: 3,
            name: 'فستان صيفي أنيق مطبوع',
            price: 1299,
            quantity: 1,
            category: 'ملابس نسائية',
            store: 'متجر الأزياء'
          },
          {
            id: 4,
            name: 'حقيبة يد جلدية عصرية',
            price: 900,
            quantity: 1,
            category: 'اكسسوارات نسائية',
            store: 'متجر الأزياء'
          }
        ]
      },
      {
        id: '3',
        order_code: 'ORD-2024-003',
        customer_name: 'علي حسين محمد',
        customer_phone: '+964 772 555 7890',
        customer_address: 'اربيل - المركز - حي المحافظة، مجمع النور',
        order_status: 'completed',
        total_amount: 1899,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        main_store_name: 'متجر المعدات الرياضية',
        assigned_store_name: 'فرع اربيل',
        customer_notes: 'تسليم في المكتب، من 9 صباحاً إلى 5 مساءً',
        items: [
          {
            id: 5,
            name: 'كرة قدم احترافية FIFA معتمدة',
            price: 799,
            quantity: 1,
            category: 'معدات رياضية',
            store: 'متجر الرياضة'
          },
          {
            id: 6,
            name: 'حذاء رياضي Nike أصلي',
            price: 1100,
            quantity: 1,
            category: 'احذية رياضية',
            store: 'متجر الرياضة'
          }
        ]
      },
      {
        id: '4',
        order_code: 'ORD-2024-004',
        customer_name: 'سارة أحمد يوسف',
        customer_phone: '+964 773 444 1234',
        customer_address: 'النجف - المركز - شارع الكوفة، قرب الجامعة',
        order_status: 'pending',
        total_amount: 3299,
        created_at: new Date(Date.now() - 43200000).toISOString(),
        main_store_name: 'متجر الكتب والقرطاسية',
        customer_notes: 'طالبة جامعية، يرجى التوصيل إلى السكن الجامعي',
        items: [
          {
            id: 7,
            name: 'لابتوب Dell للدراسة',
            price: 2799,
            quantity: 1,
            category: 'حاسوب',
            store: 'متجر التكنولوجيا'
          },
          {
            id: 8,
            name: 'حقيبة لابتوب مقاومة للماء',
            price: 500,
            quantity: 1,
            category: 'اكسسوارات',
            store: 'متجر التكنولوجيا'
          }
        ]
      }
    ];
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // استخدام البيانات التجريبية مع تفاصيل المنتجات
      const mockOrders = createMockOrders();
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      calculateStats(mockOrders);
      
      toast({
        title: "تم تحديث البيانات",
        description: "تم تحميل الطلبات مع تفاصيل المنتجات بنجاح",
      });
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "تعذر تحميل الطلبات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    const stats = ordersList.reduce(
      (acc, order) => {
        acc.totalOrders++;
        acc.totalRevenue += order.total_amount;
        
        if (order.order_status === 'pending') {
          acc.pendingOrders++;
        } else if (order.order_status === 'completed' || order.order_status === 'delivered') {
          acc.completedOrders++;
        }
        
        return acc;
      },
      { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 }
    );
    
    setStats(stats);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterOrders(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterOrders(searchTerm, status);
  };

  const filterOrders = (search: string, status: string) => {
    let filtered = orders;
    
    if (search) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status !== 'all') {
      filtered = filtered.filter(order => order.order_status === status);
    }
    
    setFilteredOrders(filtered);
  };

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrderId(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المدير المحسنة</h1>
          <p className="text-gray-600 mt-1">إدارة الطلبات مع تفاصيل المنتجات الكاملة</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 ml-1" />
            طلب جديد
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={Package}
          color="text-blue-600"
        />
        <StatCard
          title="الطلبات المعلقة"
          value={stats.pendingOrders}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="الطلبات المكتملة"
          value={stats.completedOrders}
          icon={CheckCircle2}
          color="text-green-600"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      {/* البحث والفلترة */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث عن طلب برقم الطلب أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                الكل
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('pending')}
              >
                معلقة
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('completed')}
              >
                مكتملة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات المحسنة */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تحميل الطلبات مع تفاصيل المنتجات...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* معلومات الطلب والعميل */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-blue-800">
                        طلب #{order.order_code}
                      </h3>
                      <Badge variant={order.order_status === 'completed' ? 'default' : 
                                   order.order_status === 'pending' ? 'secondary' : 'outline'}>
                        {order.order_status === 'pending' ? 'معلق' :
                         order.order_status === 'assigned' ? 'معين' :
                         order.order_status === 'completed' ? 'مكتمل' : order.order_status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-center">📞</span>
                        <span dir="ltr">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 text-center">📍</span>
                        <span className="text-gray-600">{order.customer_address}</span>
                      </div>
                      {order.customer_notes && (
                        <div className="flex items-start gap-2">
                          <span className="w-4 h-4 text-center">📝</span>
                          <span className="text-gray-600 italic">{order.customer_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* تفاصيل المنتجات */}
                  <div className="lg:col-span-1">
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      المنتجات ({order.items.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-green-800">{item.name}</div>
                              <div className="text-xs text-gray-600">
                                الفئة: {item.category} | الكمية: {item.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-700">
                                {formatCurrency(item.price)}
                              </div>
                              <div className="text-xs text-gray-500">
                                المجموع: {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ملخص المالي والإجراءات */}
                  <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-700 mb-3">ملخص الطلب</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>التاريخ:</span>
                          <span>{new Date(order.created_at).toLocaleDateString('ar-IQ')}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>المتجر:</span>
                          <span className="text-blue-600">{order.main_store_name}</span>
                        </div>
                        
                        {order.assigned_store_name && (
                          <div className="flex justify-between">
                            <span>المعين إلى:</span>
                            <span className="text-green-600">{order.assigned_store_name}</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">المجموع الكلي:</span>
                            <span className="font-bold text-lg text-purple-700">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleViewOrderDetails(order.id)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        عرض التفاصيل الكاملة
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'لم يتم العثور على طلبات تطابق معايير البحث'
                : 'لم يتم إنشاء أي طلبات بعد'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* حوار تفاصيل الطلب */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب الكاملة</DialogTitle>
          </DialogHeader>
          {selectedOrderId && (
            <OrderDetails
              orderId={selectedOrderId}
              onOrderUpdated={() => {
                fetchOrders();
                handleCloseOrderDetails();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
