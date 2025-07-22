/**
 * Enhanced hooks for order management using React Query for optimal performance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderService } from '@/services/orderService';
import { Order, OrderFilters } from '@/types/order';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to fetch orders with filters
 */
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => OrderService.getAllOrders(filters),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (replaces cacheTime)
    refetchOnWindowFocus: false,
    retry: 2
  });
};

/**
 * Hook to fetch order details
 */
export const useOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => OrderService.getOrderDetails(orderId),
    enabled: !!orderId,
    staleTime: 60000, // 1 minute
    gcTime: 300000 // 5 minutes
  });
};

/**
 * Hook to fetch order statistics
 */
export const useOrderStats = () => {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: () => OrderService.getOrderStats(),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

/**
 * Hook to fetch stores
 */
export const useStores = () => {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => OrderService.getStores(),
    staleTime: 600000, // 10 minutes
    gcTime: 1800000 // 30 minutes
  });
};

/**
 * Hook to assign order to store
 */
export const useAssignOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ orderId, storeId }: { orderId: string; storeId: string }) =>
      OrderService.assignOrderToStore(orderId, storeId),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم بنجاح",
          description: data.message || "تم تعيين الطلب بنجاح",
        });
        
        // Invalidate and refetch orders
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      } else {
        toast({
          title: "خطأ في التعيين",
          description: data.error || "فشل في تعيين الطلب",
          variant: "destructive",
        });
      }
      
      return data;
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      toast({
        title: "خطأ في التعيين",
        description: "فشل في تعيين الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['order_status'] }) =>
      OrderService.updateOrderStatus(orderId, status),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "تم التحديث",
          description: data.message || "تم تحديث حالة الطلب بنجاح",
        });
        
        // Update the specific order in cache
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      } else {
        toast({
          title: "خطأ في التحديث",
          description: data.error || "فشل في تحديث حالة الطلب",
          variant: "destructive",
        });
      }
      
      return data;
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث حالة الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook to search orders
 */
export const useSearchOrders = (searchTerm: string, filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', 'search', searchTerm, filters],
    queryFn: () => OrderService.searchOrders(searchTerm, filters),
    enabled: searchTerm.length >= 2, // Only search if term is at least 2 characters
    staleTime: 30000,
    gcTime: 300000
  });
};
