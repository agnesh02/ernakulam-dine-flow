import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ChefHat, Utensils, AlertCircle, Loader2 } from "lucide-react";
import { getSocket, joinCustomerRoom, onOrderStatusUpdate } from "@/lib/socket";
import { orderAPI } from "@/lib/api";

interface OrderStatusProps {
  currentOrder: {
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
    totalAmount: number;
    serviceCharge: number;
    gst: number;
    orderType: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    orderItems: Array<{
      id: string;
      quantity: number;
      price: number;
      menuItem: {
        id: string;
        name: string;
        prepTime: number;
        price: number;
      };
    }>;
    restaurant?: {
      id: string;
      name: string;
      cuisine: string;
      image?: string;
      preparationTime?: number;
    };
    createdAt: string;
    updatedAt: string;
  } | null;
  orderId: string | null;
  orderGroupId?: string | null; // For multi-restaurant orders
}

const statusSteps = [
  {
    id: "pending",
    label: "Order Placed",
    description: "Your order has been received",
    icon: CheckCircle,
  },
  {
    id: "paid",
    label: "Payment Confirmed",
    description: "Payment confirmed, sending to kitchen",
    icon: CheckCircle,
  },
  {
    id: "preparing", 
    label: "Preparing",
    description: "Our chef is preparing your delicious meal",
    icon: ChefHat,
  },
  {
    id: "ready",
    label: "Ready to Serve",
    description: "Your order is ready and will be served shortly",
    icon: Utensils,
  },
  {
    id: "served",
    label: "Served",
    description: "Enjoy your meal!",
    icon: CheckCircle,
  },
];

export const OrderStatus = ({ currentOrder, orderId, orderGroupId }: OrderStatusProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupOrders, setGroupOrders] = useState<Array<{
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: number;
    createdAt: string;
    restaurant?: { name: string; cuisine: string; image?: string };
    orderItems: Array<{ id: string; quantity: number; price: number; menuItem: { name: string } }>;
  }>>([]);
  
  // Fetch orders by group ID (for multi-restaurant orders)
  useEffect(() => {
    const fetchOrderGroup = async () => {
      if (!orderGroupId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await orderAPI.getByGroupId(orderGroupId);
        setGroupOrders(response.orders || []);
      } catch (err) {
        console.error('Failed to fetch order group:', err);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderGroup();
  }, [orderGroupId]);
  
  // Set up Socket.io connection for real-time updates
  useEffect(() => {
    if (orderId) {
      const socket = getSocket();
      joinCustomerRoom(orderId);

      // Listen for order status updates
      onOrderStatusUpdate((data) => {
        console.log('Order status updated:', data);
        // The parent component will handle the actual status update
      });
    }
    
    // For group orders, listen to each order's updates
    if (orderGroupId && groupOrders.length > 0) {
      const socket = getSocket();
      groupOrders.forEach(order => {
        joinCustomerRoom(order.id);
      });
      
      onOrderStatusUpdate((data) => {
        console.log('Group order status updated:', data);
        // Update the specific order in the group
        setGroupOrders(prev => 
          prev.map(order => 
            order.id === data.orderId ? { ...order, ...data.order } : order
          )
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, orderGroupId, groupOrders.length]);

  const getStepStatus = (stepId: string) => {
    if (!currentOrder) return "pending";
    
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    const currentIndex = statusSteps.findIndex(step => step.id === currentOrder.status);
    
    if (currentIndex === -1) return "pending";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getEstimatedTime = () => {
    if (!currentOrder) return "-";
    
    if (currentOrder.status === "pending" || currentOrder.status === "paid") {
      return "2-3 minutes";
    }
    if (currentOrder.status === "preparing") {
      // Calculate based on items
      const avgPrepTime = currentOrder.orderItems.reduce((total: number, item: { menuItem: { prepTime: number } }) => 
        total + item.menuItem.prepTime, 0
      ) / currentOrder.orderItems.length;
      return `${Math.ceil(avgPrepTime)}-${Math.ceil(avgPrepTime + 5)} minutes`;
    }
    if (currentOrder.status === "ready") return "Now serving";
    return "Completed";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Order Summary Skeleton */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-2/3 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
              </div>
              <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-shimmer bg-[length:200%_100%]" />
            </div>
            
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Progress Timeline Skeleton */}
        <Card className="restaurant-card">
          <div className="space-y-6">
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
            
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-shimmer bg-[length:200%_100%]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:200%_100%]" />
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="restaurant-card text-center py-12">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Order</h3>
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  // Multi-restaurant order view
  if (orderGroupId && groupOrders.length > 0) {
    const totalAmount = groupOrders.reduce((sum, order) => sum + order.grandTotal, 0);
    const allServed = groupOrders.every(order => order.status === 'served');
    const anyPreparing = groupOrders.some(order => order.status === 'preparing');
    const allReady = groupOrders.every(order => order.status === 'ready' || order.status === 'served');
    
    return (
      <div className="space-y-6">
        {/* Multi-Restaurant Order Summary */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Your Food Court Order</h3>
                <p className="text-xs text-muted-foreground">
                  {groupOrders.length} {groupOrders.length === 1 ? 'restaurant' : 'restaurants'} • Total: ₹{totalAmount}
                </p>
              </div>
              <Badge 
                className={`${
                  allServed ? "bg-status-available" :
                  allReady ? "bg-status-available" :
                  anyPreparing ? "bg-restaurant-orange" :
                  "bg-yellow-500"
                } text-white`}
              >
                {allServed ? "All Served" : allReady ? "All Ready" : anyPreparing ? "Preparing" : "Received"}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Individual Restaurant Orders */}
        {groupOrders.map((order, index) => {
          const orderStepStatus = (stepId: string) => {
            const stepIndex = statusSteps.findIndex(step => step.id === stepId);
            const currentIndex = statusSteps.findIndex(step => step.id === order.status);
            if (currentIndex === -1) return "pending";
            if (stepIndex < currentIndex) return "completed";
            if (stepIndex === currentIndex) return "current";
            return "pending";
          };

          return (
            <Card key={order.id} className="restaurant-card">
              <div className="space-y-4">
                {/* Restaurant Info */}
                {order.restaurant && (
                  <div className="flex items-center space-x-3 pb-3 border-b">
                    <div className="text-2xl">
                      {order.restaurant.image || '🍽️'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{order.restaurant.name}</h4>
                      <p className="text-xs text-muted-foreground">{order.restaurant.cuisine}</p>
                    </div>
                    <Badge 
                      className={`${
                        order.status === "pending" ? "bg-yellow-500" :
                        order.status === "paid" ? "bg-green-500" :
                        order.status === "preparing" ? "bg-restaurant-orange" :
                        order.status === "ready" ? "bg-status-available" :
                        "bg-restaurant-grey-500"
                      } text-white`}
                    >
                      {statusSteps.find(step => step.id === order.status)?.label || order.status}
                    </Badge>
                  </div>
                )}

                {/* Order Number and Time */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="font-semibold">₹{order.grandTotal}</p>
                </div>

                {/* Order Items */}
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">Items:</p>
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Compact Status Timeline */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    {statusSteps.slice(0, 4).map((step, idx) => {
                      const status = orderStepStatus(step.id);
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.id} className="flex flex-col items-center flex-1">
                          <div className={`
                            h-8 w-8 rounded-full flex items-center justify-center transition-all
                            ${status === "completed" ? "bg-status-available text-white" :
                              status === "current" ? "bg-restaurant-orange text-white ring-4 ring-restaurant-orange/20" :
                              "bg-gray-200 text-gray-400"}
                          `}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < statusSteps.slice(0, 4).length - 1 && (
                            <div className={`h-0.5 w-full -mt-4 ${
                              status === "completed" ? "bg-status-available" : "bg-gray-200"
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <Card className="restaurant-card text-center py-12">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Order</h3>
        <p className="text-muted-foreground">Place an order from our menu to track its progress here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          {/* Restaurant Info */}
          {currentOrder.restaurant && (
            <div className="flex items-center space-x-3 pb-3 border-b">
              <div className="text-2xl">
                {currentOrder.restaurant.image || '🍽️'}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ordered from</p>
                <h4 className="font-semibold">{currentOrder.restaurant.name}</h4>
                <p className="text-xs text-muted-foreground">{currentOrder.restaurant.cuisine}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Order #{currentOrder.orderNumber}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(currentOrder.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge 
              className={`${
                currentOrder.status === "pending" ? "bg-yellow-500" :
                currentOrder.status === "paid" ? "bg-green-500" :
                currentOrder.status === "preparing" ? "bg-restaurant-orange" :
                currentOrder.status === "ready" ? "bg-status-available" :
                "bg-restaurant-grey-500"
              } text-white`}
            >
              {statusSteps.find(step => step.id === currentOrder.status)?.label || currentOrder.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm mb-2 pb-2 border-b">
            <span className="text-muted-foreground">Order Type:</span>
            <Badge variant="outline" className="capitalize">
              {currentOrder.orderType === 'takeaway' ? '🛍️ Takeaway' : '🍽️ Dine-In'}
            </Badge>
          </div>

          <div className="space-y-2">
            {currentOrder.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.menuItem.name}</span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1 text-sm border-t pt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{currentOrder.totalAmount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service Charge</span>
              <span>₹{currentOrder.serviceCharge}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>₹{currentOrder.gst}</span>
            </div>
          </div>
          
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Grand Total</span>
            <span className="text-primary">₹{currentOrder.grandTotal}</span>
          </div>

          <div className="flex items-center justify-between text-sm bg-restaurant-grey-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated time:</span>
            </div>
            <span className="font-medium">{getEstimatedTime()}</span>
          </div>
        </div>
      </Card>

      {/* Progress Timeline */}
      <Card className="restaurant-card">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Order Progress</h3>
              <p className="text-sm text-gray-600">Track your order status in real-time</p>
            </div>
            
            {/* Progress Bar */}
            <div className="px-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ 
                    width: `${(() => {
                      if (!currentOrder) return 0;
                      const currentIndex = statusSteps.findIndex(step => step.id === currentOrder.status);
                      return currentIndex >= 0 ? ((currentIndex + 1) / statusSteps.length) * 100 : 0;
                    })()}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className="font-medium">Started</span>
                <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                  {currentOrder ? `${Math.round(((() => {
                    const currentIndex = statusSteps.findIndex(step => step.id === currentOrder.status);
                    return currentIndex >= 0 ? ((currentIndex + 1) / statusSteps.length) * 100 : 0;
                  })()))}% Complete` : "0% Complete"}
                </span>
                <span className="font-medium">Delivered</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 px-2">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-start space-x-4 relative py-2">
                  {/* Status Icon */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full relative
                    ${status === "completed" ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                      status === "current" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" :
                      "bg-gray-200 text-gray-500"}
                    transition-all duration-300
                  `}>
                    <Icon className="h-5 w-5" />
                    {status === "current" && (
                      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                    )}
                    {status === "completed" && (
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                    )}
                  </div>
                  
                  {/* Status Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-semibold text-base transition-colors duration-300 ${
                        status === "current" ? "text-blue-600" :
                        status === "completed" ? "text-green-600" :
                        "text-gray-500"
                      }`}>
                        {step.label}
                      </h4>
                      {status === "current" && (
                        <Badge variant="secondary" className="bg-blue-500 text-white shadow-md">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                            In Progress
                          </div>
                        </Badge>
                      )}
                      {status === "completed" && (
                        <Badge variant="secondary" className="bg-green-500 text-white shadow-md">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            {step.id === "served" ? "Done" : "Completed"}
                          </div>
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm transition-colors duration-300 leading-relaxed ${
                      status === "current" ? "text-gray-700 font-medium" :
                      status === "completed" ? "text-gray-600" :
                      "text-gray-400"
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Timeline Connector */}
                  {index < statusSteps.length - 1 && (
                    <div className={`absolute left-[1.25rem] top-12 w-0.5 h-8 transition-colors duration-500 ${
                      status === "completed" ? "bg-green-500" : 
                      status === "current" ? "bg-gradient-to-b from-green-500 to-gray-200" :
                      "bg-gray-200"
                    }`} style={{ marginLeft: '1.25rem' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Special Messages */}
      {currentOrder.status === "preparing" && (
        <Card className="restaurant-card bg-restaurant-orange/10 border-restaurant-orange">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-6 w-6 text-restaurant-orange" />
            <div>
              <h4 className="font-semibold text-restaurant-orange">Kitchen Update</h4>
              <p className="text-sm text-restaurant-grey-700">
                Your meal is being freshly prepared by our chef. Thank you for your patience!
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentOrder.status === "ready" && (
        <Card className="restaurant-card bg-status-available/10 border-status-available">
          <div className="flex items-center space-x-3">
            <Utensils className="h-6 w-6 text-status-available" />
            <div>
              <h4 className="font-semibold text-status-available">Ready to Serve!</h4>
              <p className="text-sm text-restaurant-grey-700">
                Your delicious meal is ready and our staff will serve it to your table shortly.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};