import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, Users } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  orderTime: string;
  status: "new" | "preparing" | "ready" | "served";
  estimatedTime?: number;
}

const statusConfig = {
  new: {
    label: "New Order",
    color: "bg-restaurant-orange border-restaurant-orange text-restaurant-white",
    icon: AlertTriangle,
  },
  preparing: {
    label: "Preparing",
    color: "bg-blue-500 border-blue-500 text-white",
    icon: Clock,
  },
  ready: {
    label: "Ready to Serve",
    color: "bg-status-available border-status-available text-white",
    icon: CheckCircle,
  },
  served: {
    label: "Served",
    color: "bg-restaurant-grey-500 border-restaurant-grey-500 text-white",
    icon: CheckCircle,
  },
};

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      tableNumber: 2,
      items: [
        { id: "1", name: "Chicken Biryani", quantity: 2 },
        { id: "2", name: "Raita", quantity: 1 },
        { id: "3", name: "Lassi", quantity: 2, notes: "Sweet" },
      ],
      orderTime: "12:45 PM",
      status: "new",
      estimatedTime: 25,
    },
    {
      id: "ORD-002", 
      tableNumber: 5,
      items: [
        { id: "4", name: "Masala Dosa", quantity: 1 },
        { id: "5", name: "Filter Coffee", quantity: 2 },
      ],
      orderTime: "1:15 PM",
      status: "preparing",
      estimatedTime: 15,
    },
    {
      id: "ORD-003",
      tableNumber: 9,
      items: [
        { id: "6", name: "Fish Curry", quantity: 1 },
        { id: "7", name: "Rice", quantity: 2 },
        { id: "8", name: "Papadum", quantity: 4 },
      ],
      orderTime: "12:30 PM",
      status: "ready",
    },
    {
      id: "ORD-004",
      tableNumber: 1,
      items: [
        { id: "9", name: "Tandoori Chicken", quantity: 1 },
        { id: "10", name: "Naan", quantity: 2 },
      ],
      orderTime: "11:45 AM",
      status: "served",
    },
  ]);

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const getStatusSummary = () => {
    return orders.reduce(
      (acc, order) => {
        acc[order.status]++;
        return acc;
      },
      { new: 0, preparing: 0, ready: 0, served: 0 }
    );
  };

  const statusSummary = getStatusSummary();
  const activeOrders = orders.filter(order => order.status !== "served");

  return (
    <div className="space-y-6">
      {/* Order Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusSummary).map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
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
              const Icon = config.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className={`restaurant-card ${order.status === "new" ? "border-restaurant-orange border-2" : ""}`}
                >
                  <div className="space-y-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg">Table {order.tableNumber}</span>
                      </div>
                      <Badge className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="font-medium">{order.id}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{order.orderTime}</span>
                      </div>
                      {order.estimatedTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Est. Time:</span>
                          <span className="font-medium">{order.estimatedTime} min</span>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Items:</h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          {item.notes && (
                            <span className="text-muted-foreground italic">({item.notes})</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === "new" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === "preparing" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="flex-1 restaurant-button-accent"
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, "served")}
                          className="flex-1 bg-status-available hover:opacity-90 text-white"
                        >
                          Mark Served
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