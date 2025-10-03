import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Users, X } from "lucide-react";
import { orderAPI } from "@/lib/api";
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

const statusConfig: Record<string, { label: string; color: string; icon: any; nextStatus?: string; buttonLabel?: string }> = {
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
  const { toast } = useToast();

  // Fetch orders and set up Socket.io
  useEffect(() => {
    fetchOrders();
    
    // Set up Socket.io for real-time updates
    const socket = getSocket();
    joinStaffRoom();

    // Listen for new orders
    onNewOrder((order) => {
      console.log('New order received:', order);
      setOrders(prev => [order, ...prev]);
      toast({
        title: "New Order! 🔔",
        description: `Order #${order.orderNumber} received - ₹${order.grandTotal}`,
        duration: 5000,
      });
      
      // Play notification sound (optional)
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
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
      });
    });

    return () => {
      // Clean up socket listeners
    };
  }, [toast]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await orderAPI.getAll();
      setOrders(fetchedOrders);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
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
    } catch (error: any) {
      // Revert on error
      fetchOrders();
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    // Confirm cancellation
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const removeOrderItem = async (orderId: string, itemId: string, itemName: string) => {
    // Confirm removal
    if (!confirm(`Remove "${itemName}" from this order?`)) {
      return;
    }

    try {
      const result = await orderAPI.removeOrderItem(orderId, itemId);
      
      // Update the order in state
      if (result.order.status === 'cancelled') {
        // Order was cancelled because last item was removed
        setOrders(orders.map(order => 
          order.id === orderId ? result.order : order
        ));
        toast({
          title: "Order Cancelled",
          description: "Last item removed. Order has been cancelled.",
        });
      } else {
        // Update order with new totals
        setOrders(orders.map(order => 
          order.id === orderId ? result.order : order
        ));
        toast({
          title: "Item Removed",
          description: `"${itemName}" has been removed from the order`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item",
        variant: "destructive",
      });
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
  const activeOrders = orders.filter(order => order.status !== "served");

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
        <h3 className="text-lg font-semibold">Active Orders</h3>
        
        {activeOrders.length === 0 ? (
          <Card className="restaurant-card text-center py-12">
            <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
            <p className="text-muted-foreground">All orders have been served</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => {
              const config = statusConfig[order.status];
              if (!config) return null;
              const Icon = config.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className={`restaurant-card ${order.status === "pending" ? "border-restaurant-orange border-2" : ""}`}
                >
                  <div className="space-y-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">{order.orderNumber}</span>
                      <Badge className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{formatTime(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="capitalize">
                          {order.orderType === 'takeaway' ? '🛍️ Takeaway' : '🍽️ Dine-In'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">₹{order.grandTotal}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Payment:</span>
                        <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      {order.paymentMethod && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Method:</span>
                          <Badge variant="outline" className="capitalize">
                            {order.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Items:</h4>
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{item.quantity}x</span>
                              <span className="truncate">{item.menuItem.name}</span>
                            </div>
                            {item.notes && (
                              <span className="text-xs text-muted-foreground italic">({item.notes})</span>
                            )}
                          </div>
                          {(order.status === "pending" || order.status === "paid") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderItem(order.id, item.id, item.menuItem.name)}
                              className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {config.nextStatus && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, config.nextStatus!)}
                          className={`flex-1 ${
                            config.nextStatus === "preparing" ? "bg-blue-500 hover:bg-blue-600" :
                            config.nextStatus === "ready" ? "restaurant-button-accent" :
                            "bg-status-available hover:opacity-90"
                          } text-white`}
                        >
                          {config.buttonLabel}
                        </Button>
                      )}
                      {(order.status === "pending" || order.status === "paid") && (
                        <Button
                          onClick={() => cancelOrder(order.id)}
                          variant="destructive"
                          className="flex-shrink-0"
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