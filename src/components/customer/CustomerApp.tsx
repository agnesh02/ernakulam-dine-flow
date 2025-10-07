import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalMenu } from "./DigitalMenu";
import { OrderStatus } from "./OrderStatus";
import { BillPayment } from "./BillPayment";
import { Menu, Clock, CreditCard, Loader2 } from "lucide-react";
import { orderAPI } from "@/lib/api";
import { onOrderStatusUpdate } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export const CustomerApp = () => {
  const [cart, setCart] = useState<Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    prepTime: number;
    isVegetarian: boolean;
    tags?: string[];
  }>>(() => {
    // Restore cart from localStorage on mount
    const savedCart = localStorage.getItem('customerCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [currentOrder, setCurrentOrder] = useState<{
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
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [orderId, setOrderId] = useState<string | null>(() => {
    // Restore orderId from localStorage on mount
    return localStorage.getItem('currentOrderId');
  });
  const [isRestoring, setIsRestoring] = useState(true);
  const { toast } = useToast();

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('customerCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('customerCart');
    }
  }, [cart]);

  // Restore order from backend on mount if orderId exists
  useEffect(() => {
    const restoreOrder = async () => {
      setIsRestoring(true);
      const savedOrderId = localStorage.getItem('currentOrderId');
      const savedCart = localStorage.getItem('customerCart');
      
      if (savedOrderId) {
        try {
          const order = await orderAPI.getById(savedOrderId);
          setOrderId(savedOrderId);
          setCurrentOrder(order);
          
          // If order exists, clear the cart and switch to status tab
          if (order) {
            setCart([]);
            localStorage.removeItem('customerCart');
            setActiveTab("status");
            
            toast({
              title: "Order Restored",
              description: `Your order #${order.orderNumber} has been restored.`,
            });
          }
        } catch (error) {
          console.error('Failed to restore order:', error);
          // If order fetch fails, clear the stored orderId
          localStorage.removeItem('currentOrderId');
          
          // But keep the cart if it exists
          if (savedCart) {
            toast({
              title: "Cart Restored",
              description: "Your cart items have been restored.",
            });
          }
        }
      } else if (savedCart) {
        // No order, but cart exists
        try {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart.length > 0) {
            toast({
              title: "Cart Restored",
              description: `${parsedCart.length} item(s) restored to your cart.`,
            });
          }
        } catch (e) {
          // Invalid cart data, clear it
          localStorage.removeItem('customerCart');
        }
      }
      
      setIsRestoring(false);
    };

    restoreOrder();
  }, []);

  // Listen for real-time order updates
  useEffect(() => {
    if (orderId) {
      // Fetch latest order data
      const fetchOrder = async () => {
        try {
          const order = await orderAPI.getById(orderId);
          setCurrentOrder(order);
        } catch (error) {
          console.error('Failed to fetch order:', error);
        }
      };

      // Only fetch if we don't have current order yet
      if (!currentOrder) {
        fetchOrder();
      }

      // Listen for status updates
      onOrderStatusUpdate((data) => {
        if (data.orderId === orderId && data.order) {
          setCurrentOrder(data.order);
        }
      });
    }
  }, [orderId]);

  const handleOrderPlaced = (order: {
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
    createdAt: string;
    updatedAt: string;
  }) => {
    setOrderId(order.id);
    setCurrentOrder(order);
    setCart([]); // Clear cart after placing order
    localStorage.removeItem('customerCart'); // Clear cart from localStorage
    localStorage.setItem('currentOrderId', order.id); // Save order ID
    setActiveTab("status"); // Switch to status tab
  };

  // Show loading state while restoring
  if (isRestoring) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">Customer Experience</h2>
          <p className="text-muted-foreground">Mobile-first PWA for guests at the table</p>
        </div>
        
        {/* Tabs Skeleton */}
        <Card className="restaurant-card">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 flex-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        </Card>

        {/* Content Skeleton */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md animate-shimmer bg-[length:200%_100%]" />
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md animate-shimmer bg-[length:200%_100%]" />
              ))}
            </div>
          </div>
        </Card>

        {[1, 2, 3].map((i) => (
          <Card key={i} className="restaurant-card">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]" />
                  <div className="flex space-x-4">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                  </div>
                </div>
              </div>
              <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Customer Experience</h2>
        <p className="text-muted-foreground">Mobile-first PWA for guests at the table</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-16 bg-restaurant-grey-100">
          <TabsTrigger 
            value="menu" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 px-2 text-xs sm:text-sm touch-manipulation transition-all duration-200 h-full"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden xs:inline">Menu</span>
            <span className="xs:hidden">Menu</span>
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 px-2 text-xs sm:text-sm touch-manipulation transition-all duration-200 relative h-full"
          >
            <div className="relative">
              <Clock className={`h-4 w-4 ${
                currentOrder?.status === "preparing" ? "text-blue-500" :
                currentOrder?.status === "ready" ? "text-green-500" :
                currentOrder?.status === "served" ? "text-gray-500" :
                currentOrder?.status === "paid" ? "text-emerald-500" :
                "text-orange-500"
              }`} />
              {currentOrder && currentOrder.status !== "served" && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${
                  currentOrder.status === "preparing" ? "bg-blue-500" :
                  currentOrder.status === "ready" ? "bg-green-500" :
                  currentOrder.status === "paid" ? "bg-emerald-500" :
                  "bg-orange-500"
                }`} style={{ animationDuration: '2s' }}></div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="hidden xs:inline">Order Status</span>
              <span className="xs:hidden">Status</span>
              {currentOrder && (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    currentOrder.status === "preparing" ? "bg-blue-500" :
                    currentOrder.status === "ready" ? "bg-green-500" :
                    currentOrder.status === "served" ? "bg-gray-500" :
                    currentOrder.status === "paid" ? "bg-emerald-500" :
                    "bg-orange-500"
                  }`}></div>
                  <span className={`text-[10px] font-medium ${
                    currentOrder.status === "preparing" ? "text-blue-600" :
                    currentOrder.status === "ready" ? "text-green-600" :
                    currentOrder.status === "served" ? "text-gray-600" :
                    currentOrder.status === "paid" ? "text-emerald-600" :
                    "text-orange-600"
                  }`}>
                    {currentOrder.status === "pending" ? "New" :
                     currentOrder.status === "paid" ? "Paid" :
                     currentOrder.status === "preparing" ? "Cooking" :
                     currentOrder.status === "ready" ? "Ready" :
                     currentOrder.status === "served" ? "Done" : "Active"}
                  </span>
                </div>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 px-2 text-xs sm:text-sm touch-manipulation transition-all duration-200 h-full"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden xs:inline">Bill & Payment</span>
            <span className="xs:hidden">Payment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <DigitalMenu 
            cart={cart}
            setCart={setCart}
            onOrderPlaced={handleOrderPlaced}
          />
        </TabsContent>

        <TabsContent value="status">
          <OrderStatus 
            currentOrder={currentOrder}
            orderId={orderId}
          />
        </TabsContent>

        <TabsContent value="payment">
          <BillPayment 
            currentOrder={currentOrder}
            orderId={orderId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};