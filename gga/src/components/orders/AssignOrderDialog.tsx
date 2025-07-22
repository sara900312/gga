import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArabicText } from '@/components/ui/arabic-text';
import { formatCurrency } from '@/utils/currencyUtils';
import { Loader2, Store, CheckCircle, AlertCircle } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  owner_name?: string;
  phone?: string;
  status: string;
}

interface AssignOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (storeId: string) => Promise<void>;
  stores: Store[];
  isLoading?: boolean;
  orderInfo?: {
    id: string;
    customerName: string;
    totalAmount: number;
  };
}

export const AssignOrderDialog: React.FC<AssignOrderDialogProps> = ({
  open,
  onOpenChange,
  onAssign,
  stores,
  isLoading = false,
  orderInfo
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedStoreId) return;
    
    try {
      setIsAssigning(true);
      await onAssign(selectedStoreId);
      setSelectedStoreId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning order:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancel = () => {
    setSelectedStoreId('');
    onOpenChange(false);
  };

  const selectedStore = stores.find(store => store.id === selectedStoreId);
  const activeStores = stores.filter(store => store.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            <ArabicText>تعيين الطلب للمتجر</ArabicText>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Information */}
          {orderInfo && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">
                <ArabicText>معلومات الطلب:</ArabicText>
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <ArabicText>رقم الطلب: {orderInfo.id}</ArabicText>
                </div>
                <div>
                  <ArabicText>العميل: {orderInfo.customerName}</ArabicText>
                </div>
                <div>
                  <ArabicText>المبلغ: {formatCurrency(orderInfo.totalAmount)}</ArabicText>
                </div>
              </div>
            </div>
          )}

          {/* Store Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">
              <ArabicText>اختر المتجر المناسب:</ArabicText>
            </label>
            
            {activeStores.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <ArabicText>لا توجد متاجر نشطة متاحة</ArabicText>
              </div>
            ) : (
              <Select 
                value={selectedStoreId} 
                onValueChange={setSelectedStoreId}
                disabled={isLoading || isAssigning}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedStoreId && selectedStore ? (
                      <div className="text-right w-full">
                        <ArabicText>{selectedStore.name}</ArabicText>
                      </div>
                    ) : (
                      <ArabicText>اختر متجر...</ArabicText>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="text-right w-full flex flex-col">
                        <ArabicText className="font-medium">{store.name}</ArabicText>
                        {store.owner_name && (
                          <ArabicText className="text-xs text-muted-foreground">
                            المالك: {store.owner_name}
                          </ArabicText>
                        )}
                        {store.phone && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {store.phone}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Store Info */}
          {selectedStore && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">
                  <ArabicText>المتجر المحدد:</ArabicText>
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <ArabicText className="font-medium">{selectedStore.name}</ArabicText>
                </div>
                {selectedStore.owner_name && (
                  <div className="text-muted-foreground">
                    <ArabicText>المالك: {selectedStore.owner_name}</ArabicText>
                  </div>
                )}
                {selectedStore.phone && (
                  <div className="text-muted-foreground font-mono">
                    الهاتف: {selectedStore.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isAssigning}
            >
              <ArabicText>إلغاء</ArabicText>
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedStoreId || isAssigning || activeStores.length === 0}
              className="min-w-[120px]"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  <ArabicText>جاري التعيين...</ArabicText>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  <ArabicText>تعيين الطلب</ArabicText>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
