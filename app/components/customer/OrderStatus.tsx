import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ChefHat, Utensils, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
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
  onStartNewOrder?: () => void; // Callback to start a new order
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

export const OrderStatus = ({ currentOrder, orderId, orderGroupId, onStartNewOrder }: OrderStatusProps) => {
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
      getSocket();
      joinCustomerRoom(orderId);

      // Listen for order status updates
      onOrderStatusUpdate((data) => {
        console.log('Order status updated:', data);
        // The parent component will handle the actual status update
      });
    }
    
    // For group orders, listen to each order's updates
    if (orderGroupId && groupOrders.length > 0) {
      getSocket();
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
    const anyReady = groupOrders.some(order => order.status === 'ready');
    const allReady = groupOrders.every(order => order.status === 'ready' || order.status === 'served');
    
    return (
      <div className="space-y-6">
        {/* Enhanced Multi-Restaurant Order Summary */}
        <Card className="restaurant-card overflow-hidden">
          {/* Hero Section */}
          <div className={`relative px-6 py-4 bg-gradient-to-br ${
            allServed ? "from-gray-500/10 via-gray-500/5 to-transparent" :
            allReady ? "from-green-500/10 via-green-500/5 to-transparent" :
            anyPreparing ? "from-orange-500/10 via-orange-500/5 to-transparent" :
            "from-blue-500/10 via-blue-500/5 to-transparent"
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    className={`${
                      allServed ? "bg-gray-500" :
                      allReady ? "bg-green-500" :
                      anyPreparing ? "bg-orange-500 animate-pulse" :
                      "bg-blue-500"
                    } text-white shadow-lg`}
                  >
                    {allServed ? "All Served" : allReady ? "All Ready" : anyPreparing ? "Preparing" : "Confirmed"}
                  </Badge>
                  {(anyPreparing || anyReady) && (
                    <Sparkles className="h-4 w-4 text-orange-500 animate-pulse" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  🍽️ Food Court Order
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="font-medium">{groupOrders.length} {groupOrders.length === 1 ? 'Restaurant' : 'Restaurants'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <span>{groupOrders.reduce((sum, o) => sum + o.orderItems.length, 0)} Total Items</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-primary">₹{totalAmount}</p>
              </div>
            </div>

            {/* Overall Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 text-xs font-medium text-gray-700">
                <span>Overall Progress</span>
                <span>{Math.round((groupOrders.filter(o => o.status === 'served').length / groupOrders.length) * 100)}% Complete</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 ease-out bg-green-500"
                  style={{ 
                    width: `${(groupOrders.filter(o => o.status === 'served').length / groupOrders.length) * 100}%` 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Summary Grid */}
          <div className="px-0 py-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{groupOrders.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Restaurants</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{groupOrders.filter(o => o.status === 'preparing').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Preparing</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{groupOrders.filter(o => o.status === 'served').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Served</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Individual Restaurant Orders with Enhanced Design */}
        {groupOrders.map((order) => {
          const orderStepStatus = (stepId: string) => {
            const stepIndex = statusSteps.findIndex(step => step.id === stepId);
            const currentIndex = statusSteps.findIndex(step => step.id === order.status);
            if (currentIndex === -1) return "pending";
            if (stepIndex < currentIndex) return "completed";
            if (stepIndex === currentIndex) return "current";
            return "pending";
          };

          return (
            <Card key={order.id} className={`restaurant-card overflow-hidden transition-all duration-300 ${
              order.status === 'preparing' ? 'border-2 border-orange-200 shadow-lg' :
              order.status === 'ready' ? 'border-2 border-green-200 shadow-lg animate-pulse' :
              ''
            }`}>
              {/* Restaurant Header with Status */}
              <div className={`relative px-4 py-3 bg-gradient-to-r ${
                order.status === "pending" ? "from-yellow-50 to-transparent" :
                order.status === "paid" ? "from-emerald-50 to-transparent" :
                order.status === "preparing" ? "from-orange-50 to-transparent" :
                order.status === "ready" ? "from-green-50 to-transparent" :
                "from-gray-50 to-transparent"
              }`}>
                {order.restaurant && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm text-2xl">
                      {order.restaurant.image || '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{order.restaurant.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {order.restaurant.cuisine}
                      </p>
                    </div>
                    <Badge 
                      className={`${
                        order.status === "pending" ? "bg-yellow-500" :
                        order.status === "paid" ? "bg-emerald-500" :
                        order.status === "preparing" ? "bg-orange-500 animate-pulse" :
                        order.status === "ready" ? "bg-green-500 animate-pulse" :
                        "bg-gray-500"
                      } text-white shadow-md font-semibold`}
                    >
                      {statusSteps.find(step => step.id === order.status)?.label || order.status}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 space-y-3">
                {/* Order Number and Amount */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold text-primary">₹{order.grandTotal}</p>
                  </div>
                </div>

                {/* Order Items with Modern Styling */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Items</h5>
                    <Badge variant="secondary" className="text-xs">
                      {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                  {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {item.quantity}×
                      </span>
                          <span className="font-medium text-gray-800">{item.menuItem.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Enhanced Status Timeline */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Progress</p>
                  <div className="relative">
                    {/* Progress Line - spans from first to last icon */}
                    <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full"></div>
                    <div 
                      className="absolute top-4 left-4 h-1 rounded-full transition-all duration-1000 bg-green-500"
                      style={{
                        width: `calc((100% - 2rem) * ${(() => {
                          const currentIndex = statusSteps.findIndex(step => step.id === order.status);
                          return currentIndex >= 0 ? currentIndex / (statusSteps.length - 1) : 0;
                        })()})`
                      }}
                    ></div>
                    
                    {/* Status Icons */}
                    <div className="relative flex items-center justify-between w-full">
                      {statusSteps.map((step) => {
                      const status = orderStepStatus(step.id);
                      const Icon = step.icon;
                      
                      return (
                          <div key={step.id} className="flex flex-col items-center">
                          <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10
                              ${status === "completed" ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30" :
                                status === "current" ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-110" :
                                "bg-white border-2 border-gray-200 text-gray-400"}
                            `}>
                              <Icon className="h-3.5 w-3.5" />
                              {status === "current" && (
                                <div className="absolute inset-0 rounded-lg bg-orange-500 animate-ping opacity-30"></div>
                              )}
                            </div>
                            <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight whitespace-nowrap ${
                              status === "current" ? "text-orange-600" :
                              status === "completed" ? "text-green-600" :
                              "text-gray-400"
                            }`}>
                              {step.id === 'pending' ? 'Placed' :
                               step.id === 'paid' ? 'Paid' :
                               step.id === 'preparing' ? 'Cooking' :
                               step.id === 'ready' ? 'Ready' :
                               'Served'}
                            </p>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>

                {/* Status-specific Messages */}
                {order.status === 'preparing' && (
                  <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                    <ChefHat className="h-3.5 w-3.5 animate-bounce flex-shrink-0" />
                    <span className="font-semibold">Being prepared in the kitchen...</span>
                  </div>
                )}
                {order.status === 'ready' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-semibold">Ready - Will be served shortly!</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Enhanced Order More Button for Multi-Restaurant Orders */}
        {allServed && onStartNewOrder && (
          <Card className="restaurant-card bg-gradient-to-br from-primary/10 via-purple-50/30 to-transparent border-2 border-primary/30 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full -ml-16 -mb-16"></div>
            <div className="relative text-center space-y-4 p-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 mb-2">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-bold text-2xl text-gray-900 mb-2">All Orders Served! 🎉</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  We hope you enjoyed your meal from {groupOrders.length} amazing {groupOrders.length === 1 ? 'restaurant' : 'restaurants'}! Order more delicious food anytime.
                </p>
              </div>
              <Button
                onClick={onStartNewOrder}
                className="w-full sm:w-auto bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-bold"
                size="lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Order More Food
              </Button>
            </div>
          </Card>
        )}
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
      {/* Single Restaurant Order Card - Matching Multi-Restaurant Design */}
      <Card className={`restaurant-card overflow-hidden transition-all duration-300 ${
        currentOrder.status === 'preparing' ? 'border-2 border-orange-200 shadow-lg' :
        currentOrder.status === 'ready' ? 'border-2 border-green-200 shadow-lg animate-pulse' :
        ''
      }`}>
        {/* Restaurant Header with Status */}
        <div className={`relative px-4 py-3 bg-gradient-to-r ${
          currentOrder.status === "pending" ? "from-yellow-50 to-transparent" :
          currentOrder.status === "paid" ? "from-emerald-50 to-transparent" :
          currentOrder.status === "preparing" ? "from-orange-50 to-transparent" :
          currentOrder.status === "ready" ? "from-green-50 to-transparent" :
          "from-gray-50 to-transparent"
        }`}>
          {currentOrder.restaurant && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm text-2xl">
                {currentOrder.restaurant.image || '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{currentOrder.restaurant.name}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {currentOrder.restaurant.cuisine}
                </p>
              </div>
              <Badge 
                className={`${
                  currentOrder.status === "pending" ? "bg-yellow-500" :
                  currentOrder.status === "paid" ? "bg-emerald-500" :
                  currentOrder.status === "preparing" ? "bg-orange-500 animate-pulse" :
                  currentOrder.status === "ready" ? "bg-green-500 animate-pulse" :
                  "bg-gray-500"
                } text-white shadow-md font-semibold`}
              >
                {statusSteps.find(step => step.id === currentOrder.status)?.label || currentOrder.status}
              </Badge>
            </div>
          )}
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Order Number and Amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Order #{currentOrder.orderNumber}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {new Date(currentOrder.createdAt).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-xl font-bold text-primary">₹{currentOrder.grandTotal}</p>
            </div>
          </div>
          
          {/* Order Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {currentOrder.orderType === 'takeaway' ? '🛍️ Takeaway' : '🍽️ Dine-In'}
            </Badge>
            {(currentOrder.status === "preparing" || currentOrder.status === "ready") && (
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                currentOrder.status === "preparing" ? "bg-orange-100 text-orange-700" :
                "bg-green-100 text-green-700"
              }`}>
                <Clock className="h-3 w-3" />
                <span className="font-semibold">ETA: {getEstimatedTime()}</span>
              </div>
            )}
          </div>

          {/* Order Items with Modern Styling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Items</h5>
              <Badge variant="secondary" className="text-xs">
                {currentOrder.orderItems.length} {currentOrder.orderItems.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <div className="space-y-1.5">
            {currentOrder.orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {item.quantity}×
                    </span>
                    <span className="font-medium text-gray-800">{item.menuItem.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
            </div>
          </div>
          
          {/* Bill Breakdown */}
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{currentOrder.totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Charge</span>
              <span className="font-medium">₹{currentOrder.serviceCharge}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (5%)</span>
              <span className="font-medium">₹{currentOrder.gst}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-base border-t pt-2 mt-2">
              <span className="text-gray-900">Grand Total</span>
              <span className="text-primary text-xl">₹{currentOrder.grandTotal}</span>
            </div>
          </div>
          
          {/* Enhanced Status Timeline */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Progress</p>
            <div className="relative">
              {/* Progress Line - spans from first to last icon */}
              <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute top-4 left-4 h-1 rounded-full transition-all duration-1000 bg-green-500"
                style={{
                  width: `calc((100% - 2rem) * ${(() => {
                    const currentIndex = statusSteps.findIndex(step => step.id === currentOrder.status);
                    return currentIndex >= 0 ? currentIndex / (statusSteps.length - 1) : 0;
                  })()})`
                }}
              ></div>
              
              {/* Status Icons */}
              <div className="relative flex items-center justify-between w-full">
                {statusSteps.map((step) => {
                  const status = getStepStatus(step.id);
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10
                        ${status === "completed" ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30" :
                          status === "current" ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-110" :
                          "bg-white border-2 border-gray-200 text-gray-400"}
                      `}>
                        <Icon className="h-3.5 w-3.5" />
                        {status === "current" && (
                          <div className="absolute inset-0 rounded-lg bg-orange-500 animate-ping opacity-30"></div>
                        )}
                      </div>
                      <p className={`text-[9px] mt-1.5 font-medium text-center leading-tight whitespace-nowrap ${
                        status === "current" ? "text-orange-600" :
                        status === "completed" ? "text-green-600" :
                        "text-gray-400"
                      }`}>
                        {step.id === 'pending' ? 'Placed' :
                         step.id === 'paid' ? 'Paid' :
                         step.id === 'preparing' ? 'Cooking' :
                         step.id === 'ready' ? 'Ready' :
                         'Served'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status-specific Messages */}
          {currentOrder.status === 'preparing' && (
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
              <ChefHat className="h-3.5 w-3.5 animate-bounce flex-shrink-0" />
              <span className="font-semibold">Being prepared in the kitchen...</span>
            </div>
          )}
          {currentOrder.status === 'ready' && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 animate-pulse">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-semibold">Ready - Will be served shortly!</span>
          </div>
          )}
        </div>
      </Card>

      {/* Served completion card */}
      {currentOrder.status === "served" && onStartNewOrder && (
        <Card className="restaurant-card bg-gradient-to-br from-primary/10 via-purple-50/30 to-transparent border-2 border-primary/30 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full -ml-16 -mb-16"></div>
          <div className="relative text-center space-y-4 p-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white shadow-lg shadow-primary/40 mb-2">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-bold text-2xl text-gray-900 mb-2">Enjoyed your meal? 😋</h4>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                We hope you loved your food! Order more delicious meals from any restaurant in our food court!
              </p>
            </div>
            <Button
              onClick={onStartNewOrder}
              className="w-full sm:w-auto bg-blue-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all hover:scale-105 font-bold"
              size="lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Order More Food
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
