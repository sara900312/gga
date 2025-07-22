/**
 * Order service for data processing and currency conversion
 */

import { Order, OrderItem } from '@/types/order';
import { convertSARToIQD, convertIQDToSAR } from '@/utils/currency';

export class OrderService {
  /**
   * Convert order prices from SAR to IQD
   */
  static convertOrderPricesToIQD(order: any): Order {
    // Process order items without conversion - treat as Iraqi Dinars
    const convertedOrderItems = order.order_items?.map((item: any) => ({
      ...item,
      price: item.price || 0,
      price_iqd: item.price || 0,
      price_sar: item.price || 0
    }));

    // Process legacy items format without conversion
    const convertedItems = order.items?.map((item: any) => ({
      ...item,
      price: item.price || 0,
      price_iqd: item.price || 0,
      price_sar: item.price || 0
    }));

    // Use amounts as-is (treat as Iraqi Dinars)
    const totalAmount = order.total_amount || 0;

    return {
      ...order,
      order_items: convertedOrderItems,
      items: convertedItems,
      total_amount: totalAmount,
      total_amount_sar: totalAmount,
      total_amount_iqd: totalAmount
    };
  }

  /**
   * Process raw order data from database to include currency conversions
   */
  static processOrderData(orders: any[]): Order[] {
    return orders.map(order => this.convertOrderPricesToIQD(order));
  }

  /**
   * Calculate order total from items
   */
  static calculateOrderTotal(items: OrderItem[] | any[], currency: 'SAR' | 'IQD' = 'IQD'): number {
    if (!items || items.length === 0) return 0;

    return items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      if (currency === 'IQD') {
        const priceIQD = item.price_iqd || convertSARToIQD(item.price_sar || item.price || 0);
        return sum + (priceIQD * quantity);
      } else {
        const priceSAR = item.price_sar || item.price || 0;
        return sum + (priceSAR * quantity);
      }
    }, 0);
  }

  /**
   * Ensure order has both SAR and IQD amounts calculated
   */
  static normalizeOrderAmounts(order: any): Order {
    const processedOrder = this.convertOrderPricesToIQD(order);
    
    // Recalculate totals from items if they exist
    if (processedOrder.order_items?.length > 0) {
      processedOrder.total_amount_iqd = this.calculateOrderTotal(processedOrder.order_items, 'IQD');
      processedOrder.total_amount_sar = this.calculateOrderTotal(processedOrder.order_items, 'SAR');
      processedOrder.total_amount = processedOrder.total_amount_sar;
    } else if (processedOrder.items?.length > 0) {
      processedOrder.total_amount_iqd = this.calculateOrderTotal(processedOrder.items, 'IQD');
      processedOrder.total_amount_sar = this.calculateOrderTotal(processedOrder.items, 'SAR');
      processedOrder.total_amount = processedOrder.total_amount_sar;
    }

    return processedOrder;
  }
}
