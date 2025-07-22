import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrderAssignment } from "@/hooks/useOrderAssignment";
import { Tables } from "@/integrations/supabase/types";
import { Loader2, CheckCircle, XCircle, Clock, Package } from "lucide-react";

type Store = Tables<"stores">;

interface OrderAssignmentButtonProps {
  orderId: string;
  currentStoreId?: string | null;
  currentStatus?: string | null;
  stores: Store[];
  onAssignmentChange?: () => void;
  disabled?: boolean;
  variant?: "select" | "button" | "badge";
}

const OrderAssignmentButton: React.FC<OrderAssignmentButtonProps> = ({
  orderId,
  currentStoreId,
  currentStatus,
  stores,
  onAssignmentChange,
  disabled = false,
  variant = "select",
}) => {
  const {
    assignOrderToStore,
    assignOrderWithStatus,
    unassignOrder,
    markOrderAsDelivered,
    markOrderAsReturned,
    isLoading,
  } = useOrderAssignment({
    onSuccess: () => {
      onAssignmentChange?.();
    },
  });

  // تحديد حالة الطلب مع الأيقونة المناسبة
  const getStatusInfo = (status: string | null | undefined) => {
    switch (status) {
      case "pending":
        return {
          label: "في الانتظار",
          icon: Clock,
          variant: "secondary" as const,
          color: "text-yellow-600",
        };
      case "assigned":
        return {
          label: "معين",
          icon: Package,
          variant: "default" as const,
          color: "text-blue-600",
        };
      case "delivered":
        return {
          label: "مسلم",
          icon: CheckCircle,
          variant: "default" as const,
          color: "text-green-600",
        };
      case "returned":
        return {
          label: "مرتجع",
          icon: XCircle,
          variant: "destructive" as const,
          color: "text-red-600",
        };
      default:
        return {
          label: "غير محدد",
          icon: Clock,
          variant: "outline" as const,
          color: "text-gray-600",
        };
    }
  };

  // معالج تعيين الطلب لمتجر
  const handleAssignToStore = async (storeId: string) => {
    if (storeId === "unassign") {
      await unassignOrder(orderId);
    } else {
      await assignOrderWithStatus(orderId, storeId);
    }
  };

  // معالج تغيير حالة الطلب
  const handleStatusChange = async (newStatus: string) => {
    switch (newStatus) {
      case "delivered":
        await markOrderAsDelivered(orderId);
        break;
      case "returned":
        await markOrderAsReturned(orderId);
        break;
    }
  };

  const statusInfo = getStatusInfo(currentStatus);
  const StatusIcon = statusInfo.icon;

  // عرض Badge للحالة فقط
  if (variant === "badge") {
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
        {statusInfo.label}
      </Badge>
    );
  }

  // عرض Select لتعيين المتجر
  if (variant === "select") {
    return (
      <div className="flex flex-col gap-2">
        {/* حالة الطلب */}
        <Badge
          variant={statusInfo.variant}
          className="flex items-center gap-1 w-fit"
        >
          <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
          {statusInfo.label}
        </Badge>

        {/* تعيين المتجر */}
        <Select
          value={currentStoreId || "unassigned"}
          onValueChange={handleAssignToStore}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="min-w-[150px]">
            <SelectValue placeholder="اختر متجر" />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">غير معين</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* تحديث الحالة للطلبات المعينة */}
        {currentStoreId && currentStatus === "assigned" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("delivered")}
              disabled={isLoading}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              تسليم
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("returned")}
              disabled={isLoading}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              إرجاع
            </Button>
          </div>
        )}
      </div>
    );
  }

  // عرض Button للتعيين السريع
  return (
    <Button
      onClick={() => {
        if (currentStoreId) {
          unassignOrder(orderId);
        } else {
          // يمكن تخصيص هذا ليفتح modal لاختيار المتجر
          console.log("Open store selection modal");
        }
      }}
      disabled={disabled || isLoading}
      variant={currentStoreId ? "destructive" : "default"}
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <StatusIcon className="h-4 w-4 mr-2" />
      )}
      {currentStoreId ? "إلغاء التعيين" : "تعيين متجر"}
    </Button>
  );
};

export default OrderAssignmentButton;
