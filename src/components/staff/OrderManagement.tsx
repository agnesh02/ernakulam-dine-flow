import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";
import { orderAPI } from "@/lib/api";
import { getSocket, joinStaffRoom, onNewOrder, onOrderStatusUpdate, onOrderPaid } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
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
        <Card className="restaurant-card text-center py-12">
          <p className="text-muted-foreground">Loading orders...</p>
        </Card>
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
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Items:</h4>
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem.name}</span>
                          {item.notes && (
                            <span className="text-muted-foreground italic">({item.notes})</span>
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