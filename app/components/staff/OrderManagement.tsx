import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { orderAPI, authAPI } from "@/lib/api";
import { getSocket, joinStaffRoom, onNewOrder, onOrderStatusUpdate, onOrderPaid } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType?: string;
  totalAmount: number;
  serviceCharge: number;
  gst: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod?: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    notes?: string;
    menuItem: {
      id: string;
      name: string;
      prepTime: number;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }>; nextStatus?: string; buttonLabel?: string }> = {
  pending: {
    label: "New Order",
    color: "bg-restaurant-orange border-restaurant-orange text-restaurant-white",
    icon: AlertTriangle,
    nextStatus: "paid",
    buttonLabel: "Mark Paid",
  },
  paid: {
    label: "Paid",
    color: "bg-green-600 border-green-600 text-white",
    icon: CheckCircle,
    nextStatus: "preparing",
    buttonLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    color: "bg-blue-500 border-blue-500 text-white",
    icon: Clock,
    nextStatus: "ready",
    buttonLabel: "Mark Ready",
  },
  ready: {
    label: "Ready to Serve",
    color: "bg-status-available border-status-available text-white",
    icon: CheckCircle,
    nextStatus: "served",
    buttonLabel: "Mark Served",
  },
  served: {
    label: "Served",
    color: "bg-restaurant-grey-500 border-restaurant-grey-500 text-white",
    icon: CheckCircle,
  },
};

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get restaurant ID from staff info
  const staffInfo = authAPI.getStaffInfo();
  const restaurantId = staffInfo?.restaurantId;

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      toast({
        title: "Error",
        description: "Unable to determine your restaurant. Please log in again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Fetch only orders for this restaurant
      const fetchedOrders = await orderAPI.getAll(undefined, restaurantId);
      setOrders(fetchedOrders);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch orders";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, restaurantId]);

  // Fetch orders and set up Socket.io
  useEffect(() => {
    fetchOrders();
    
    // Set up Socket.io for real-time updates with restaurant context
    getSocket();
    const staffInfo = typeof window !== 'undefined' ? localStorage.getItem('staffInfo') : null;
    const restaurantId = staffInfo ? JSON.parse(staffInfo).restaurantId : null;
    joinStaffRoom(restaurantId);

    // Listen for new orders
    onNewOrder((order) => {
      console.log('New order received:', order);
      setOrders(prev => [order, ...prev]);
      toast({
        title: "New Order! 🔔",
        description: `Order #${order.orderNumber} received - ₹${order.grandTotal}`,
        duration: 5000,
        variant: "info",
      });
      
      // Play notification sound (optional)
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {
            // Ignore audio play errors
          });
        } catch {
          // Ignore audio errors
        }
      }
    });

    // Listen for order status updates
    onOrderStatusUpdate((data) => {
      console.log('Order status updated:', data);
      setOrders(prev => 
        prev.map(order => 
          order.id === data.orderId 
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    // Listen for payment updates
    onOrderPaid((order) => {
      console.log('Order paid:', order);
      setOrders(prev => 
        prev.map(o => 
          o.id === order.id ? order : o
        )
      );
      toast({
        title: "Payment Received",
        description: `Order #${order.orderNumber} has been paid`,
        variant: "success",
      });
    });

    return () => {
      // Clean up socket listeners
    };
  }, [toast, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (updatingOrderId === orderId) return; // Prevent updating the same order multiple times
    
    setUpdatingOrderId(orderId);
    
    // Optimistic update
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));

    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast({
        title: "Status Updated",
        description: `Order status updated to ${statusConfig[newStatus]?.label}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update order status";
      // Revert on error
      fetchOrders();
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (updatingOrderId === orderId) return; // Prevent updating the same order multiple times
    
    // Confirm cancellation
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      await orderAPI.cancelOrder(orderId);
      // Remove from list or update status
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      ));
      toast({
        title: "Order Cancelled",
        description: "The order has been cancelled successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to cancel order";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };




  const getStatusSummary = () => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const statusSummary = getStatusSummary();
  const activeOrders = orders.filter(order => 
    order.status !== "served" && order.status !== "cancelled"
  );

  // Debug logging for active orders
  console.log('Order Management Debug:', {
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    servedOrders: orders.filter(o => o.status === 'served').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
    orderStatuses: orders.map(o => ({ id: o.id, status: o.status, orderNumber: o.orderNumber }))
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Status Overview Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="restaurant-card">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
                <div className="space-y-2 flex-1">
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Orders List Skeleton */}
        <div>
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-32 mb-4 animate-shimmer bg-[length:200%_100%]" />
          
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="restaurant-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4 animate-shimmer bg-[length:200%_100%]" />
                    </div>
                    <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-shimmer bg-[length:200%_100%]" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                    {[1, 2].map((j) => (
                      <div key={j} className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]" />
                    ))}
                  </div>
                  
                  <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusSummary).map(([status, count]) => {
          const config = statusConfig[status];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <Card key={status} className="restaurant-card">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Active Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary">Active Orders</h3>
          <div className="text-sm text-muted-foreground">
            {activeOrders.length} active {activeOrders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
        
        {activeOrders.length === 0 ? (
          <Card className="restaurant-card text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-3">No Active Orders</h3>
            <p className="text-muted-foreground text-lg">All orders have been served or cancelled</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => {
              const config = statusConfig[order.status];
              if (!config) return null;
              const Icon = config.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className={`restaurant-card relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    order.status === "pending" ? "border-restaurant-orange border-2 bg-orange-50/50" :
                    order.status === "paid" ? "border-green-500 border-2 bg-green-50/50" :
                    order.status === "preparing" ? "border-blue-500 border-2 bg-blue-50/50" :
                    order.status === "ready" ? "border-status-available border-2 bg-emerald-50/50" :
                    ""
                  }`}
                >
                  {/* Status Indicator Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />

                  <div className="space-y-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-2xl">{order.orderNumber}</span>
                        <div className="text-sm text-muted-foreground mt-1">{formatTime(order.createdAt)}</div>
                      </div>
                      <Badge className={`${config.color} text-sm px-3 py-1 h-auto font-semibold`}>
                        <Icon className="h-4 w-4 mr-2" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Order Type & Payment */}
                    <div className="flex items-center justify-between bg-white/80 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <Badge variant="outline" className="capitalize text-sm">
                          {order.orderType === 'takeaway' ? '🛍️ Takeaway' : '🍽️ Dine-In'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"} className="capitalize">
                          {order.paymentStatus}
                        </Badge>
                        {order.paymentMethod && (
                          <Badge variant="outline" className="capitalize">
                            {order.paymentMethod === 'online' ? '💳' : '💵'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 bg-white/80 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Order Items</h4>
                        <span className="text-lg font-bold text-primary">₹{order.grandTotal}</span>
                      </div>
                      <div className="space-y-2 divide-y">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-2 pt-2 first:pt-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{item.quantity}x</span>
                                <span className="font-medium">{item.menuItem.name}</span>
                              </div>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-0.5">{item.notes}</p>
                              )}
                            </div>
                            {/* Removed individual item quantity controls - restaurants only see cancel order option */}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {config.nextStatus && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, config.nextStatus!)}
                          disabled={updatingOrderId === order.id}
                          className={`flex-1 h-12 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                            config.nextStatus === "preparing" ? "bg-blue-500 hover:bg-blue-600" :
                            config.nextStatus === "ready" ? "restaurant-button-accent" :
                            "bg-status-available hover:opacity-90"
                          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingOrderId === order.id ? "Processing..." : config.buttonLabel}
                        </Button>
                      )}
                      {(order.status === "pending" || order.status === "paid") && (
                        <Button
                          onClick={() => cancelOrder(order.id)}
                          disabled={updatingOrderId === order.id}
                          variant="outline"
                          className="flex-shrink-0 h-12 border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};