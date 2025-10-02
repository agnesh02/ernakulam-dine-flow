import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { menuAPI, orderAPI } from "@/lib/api";
import { openRazorpayPayment, RAZORPAY_KEY_ID, RazorpayOptions, debugRazorpayEnvironment } from "@/lib/razorpay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Clock,
  ChefHat,
  Coffee,
  Salad,
  Dessert,
  Star,
  X,
  CreditCard,
  Wallet,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTime: number;
  rating: number;
  isAvailable: boolean;
  image?: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface CreatedOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  serviceCharge: number;
  gst: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

interface DigitalMenuProps {
  cart: OrderItem[];
  setCart: (order: OrderItem[]) => void;
  onOrderPlaced: (order: CreatedOrder) => void;
}

const categoryIcons = {
  mains: ChefHat,
  beverages: Coffee,
  appetizers: Salad,
  desserts: Dessert,
};

export const DigitalMenu = ({ cart, setCart, onOrderPlaced }: DigitalMenuProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCart, setShowCart] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const items = await menuAPI.getAll(true); // Only get available items
      setMenuItems(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch menu items";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(
        cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(
        cart.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      );
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const getItemQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    setShowPaymentChoice(true);
  };

  const placeOrderWithPaymentMethod = async (paymentChoice: 'prepay' | 'postpay') => {
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    
    try {
      // Prepare order items
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
      }));

      // IMPROVED FLOW: For prepay, process payment FIRST, create order ONLY after success
      if (paymentChoice === 'prepay') {
        setIsProcessingPayment(true);
        
        // Close payment choice dialog first
        setShowPaymentChoice(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Debug Razorpay environment
        debugRazorpayEnvironment();
        
        // Step 1: Create Razorpay payment order (NO restaurant order created yet!)
        const paymentData = await orderAPI.createPrepayment(orderItems);
        
        // Step 2: Process Payment FIRST (no order exists yet)
        try {
          // Show payment processing state
          toast({
            title: "Opening Payment Gateway...",
            description: "Complete payment to place your order.",
          });

          // Open payment gateway
          await new Promise<void>((resolvePayment, rejectPayment) => {
            const razorpayOptions: RazorpayOptions = {
              key: RAZORPAY_KEY_ID,
              amount: paymentData.amount * 100, // Convert to paise
              currency: paymentData.currency,
              name: 'Ernakulam Dine Flow',
              description: `Order Total: ₹${paymentData.amount}`,
              order_id: paymentData.razorpayOrderId,
              prefill: {
                name: 'Customer',
                email: 'customer@example.com',
                contact: '9999999999',
              },
              theme: {
                color: '#f97316',
              },
              handler: async (response: any) => {
                try {
                  // Step 3: Payment successful! Create order NOW
                  console.log('💳 Razorpay payment successful, response:', response);
                  
                  toast({
                    title: "Payment Successful!",
                    description: "Creating your order...",
                  });

                  // Verify payment and create order in one call
                  console.log('🔐 Verifying prepayment with data:', {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    has_signature: !!response.razorpay_signature,
                    items_count: orderItems.length
                  });
                  
                  const result = await orderAPI.verifyPrepayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    items: orderItems,
                  });

                  console.log('✅ Verification successful, order created:', result);
                  const createdOrder = result.order;

                  // Notify parent component (order is now created and sent to kitchen)
                  onOrderPlaced(createdOrder);
                  
                  // Show success toast
                  toast({
                    title: "Order Placed & Paid! 🎉",
                    description: `Your order #${createdOrder.orderNumber} is confirmed and sent to kitchen. Total: ₹${createdOrder.grandTotal}`,
                    duration: 5000,
                  });
                  
                  // Scroll to top
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  
                  resolvePayment();
                } catch (error: unknown) {
                  console.error('❌ Error in payment verification:', error);
                  const message = error instanceof Error ? error.message : "Failed to create order after payment";
                  console.error('❌ Error message:', message);
                  toast({
                    title: "Order Creation Failed",
                    description: message + " - Please contact support with your payment details.",
                    variant: "destructive",
                  });
                  rejectPayment(new Error(message));
                }
              },
              modal: {
                ondismiss: () => {
                  // Step 4: Payment cancelled - NO order to cancel (none was created!)
                  toast({
                    title: "Payment Cancelled",
                    description: "Order was not placed. You can try again or choose Pay Later.",
                    variant: "destructive",
                  });
                  rejectPayment(new Error('Payment cancelled by user'));
                },
              },
            };

            openRazorpayPayment(razorpayOptions).catch(rejectPayment);
          });

        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Payment was not completed";
          throw new Error(message);
        }
      } else {
        // POSTPAY: Create order immediately (existing flow)
        const createdOrder = await orderAPI.create({ 
          items: orderItems,
          paymentMethod: 'cash',
        });

        // Notify parent component
        onOrderPlaced(createdOrder);
        
        // Show success toast
        toast({
          title: "Order Placed Successfully! 🎉",
          description: `Your order #${createdOrder.orderNumber} has been placed. Pay after your meal is served.`,
          duration: 5000,
        });
        
        setShowPaymentChoice(false);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to place order. Please try again.";
      toast({
        title: "Order Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
      setIsProcessingPayment(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const isAvailable = item.isAvailable;
    return matchesSearch && matchesCategory && isAvailable;
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="restaurant-card text-center py-12">
          <p className="text-muted-foreground">Loading menu...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for delicious food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={`text-xs sm:text-sm px-3 py-2 h-auto min-h-[36px] touch-manipulation ${selectedCategory === "all" ? "restaurant-button-accent" : ""}`}
            >
              All
            </Button>
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || ChefHat;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 py-2 h-auto min-h-[36px] touch-manipulation ${selectedCategory === category ? "restaurant-button-accent" : ""}`}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  <span className="xs:hidden">{category.charAt(0).toUpperCase() + category.slice(1, 3)}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <div className="grid gap-3 sm:gap-4">
        {filteredItems.map((item) => {
          const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
          const quantity = getItemQuantity(item.id);
          
          return (
            <Card key={item.id} className="restaurant-card">
              <div className="space-y-3 sm:space-y-4">
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="p-2 sm:p-3 bg-restaurant-grey-100 rounded-lg flex-shrink-0">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{item.name}</h3>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs sm:text-sm font-medium">{item.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                        <span className="font-bold text-base sm:text-lg text-primary">₹{item.price}</span>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">{item.prepTime} min</span>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs w-fit">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Controls */}
                <div className="flex items-center justify-between">
                  {quantity === 0 ? (
                    <Button
                      onClick={() => addToCart(item)}
                      className="restaurant-button-accent flex-1 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Order
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-base sm:text-lg min-w-[2rem] text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCart(item)}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="ml-auto font-bold text-primary text-sm sm:text-base">
                        ₹{item.price * quantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Floating Order Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="restaurant-card bg-primary text-primary-foreground border-primary shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-2 bg-restaurant-white/20 rounded-lg flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base">{getTotalItems()} items in cart</p>
                  <p className="text-xs sm:text-sm opacity-90">Total: ₹{getTotalAmount()}</p>
                </div>
              </div>
              <div className="flex space-x-2 flex-shrink-0">
                <Dialog open={showCart} onOpenChange={setShowCart}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/20 bg-white/10 px-3 sm:px-4 py-2 h-9 sm:h-10 font-medium transition-all duration-300 hover:opacity-90 text-xs sm:text-sm touch-manipulation"
                    >
                      <span className="hidden xs:inline">View Cart</span>
                      <span className="xs:hidden">Cart</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Your Order
                      </DialogTitle>
                      <DialogDescription>
                        Review and modify your order before placing it
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {cart.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Your cart is empty</p>
                        </div>
                      ) : (
                        <>
                          {/* Cart Items */}
                          <div className="space-y-3">
                            {cart.map((item) => {
                              const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
                              return (
                                <Card key={item.id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="p-2 bg-restaurant-grey-100 rounded-lg">
                                        <Icon className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFromCart(item.id)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addToCart(item)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFromCart(item.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">
                                      {item.quantity} × ₹{item.price}
                                    </span>
                                    <span className="font-bold text-sm">
                                      ₹{item.price * item.quantity}
                                    </span>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Order Summary */}
                          <Card className="p-4 bg-muted">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Items ({getTotalItems()})</span>
                                <span>₹{getTotalAmount()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Service Charge (5%)</span>
                                <span>₹{Math.round(getTotalAmount() * 0.05)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>GST (18%)</span>
                                <span>₹{Math.round(getTotalAmount() * 0.18)}</span>
                              </div>
                              <div className="border-t pt-2">
                                <div className="flex justify-between font-bold text-lg">
                                  <span>Total</span>
                                  <span>₹{getTotalAmount() + Math.round(getTotalAmount() * 0.23)}</span>
                                </div>
                              </div>
                            </div>
                          </Card>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowCart(false)}
                              className="flex-1"
                            >
                              Continue Shopping
                            </Button>
                            <Button
                              onClick={handlePlaceOrderClick}
                              disabled={isPlacingOrder}
                              className="flex-1 restaurant-gradient-accent text-white hover:opacity-90"
                            >
                              Place Order
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={handlePlaceOrderClick}
                  disabled={isPlacingOrder}
                  className="restaurant-gradient-accent text-white hover:opacity-90 shadow-orange px-4 py-2 h-10 font-medium transition-all duration-300"
                >
                  Place Order →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {filteredItems.length === 0 && (
        <Card className="restaurant-card text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">Try searching for something else or check other categories</p>
        </Card>
      )}

       {/* Payment Choice Dialog */}
       <AlertDialog open={showPaymentChoice} onOpenChange={setShowPaymentChoice}>
         <AlertDialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
           <AlertDialogHeader className="pb-3">
             <AlertDialogTitle className="text-lg">Choose Payment Method</AlertDialogTitle>
             <AlertDialogDescription className="text-sm">
               Select how you'd like to pay for your order
             </AlertDialogDescription>
           </AlertDialogHeader>

           {isPlacingOrder ? (
             <div className="py-6 text-center space-y-3">
               {isProcessingPayment ? (
                 <>
                   <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                   <h3 className="text-base font-semibold">Processing Payment...</h3>
                   <p className="text-xs text-muted-foreground">
                     Please wait while we process your payment securely
                   </p>
                 </>
               ) : (
                 <>
                   <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                   <h3 className="text-base font-semibold">Placing Your Order...</h3>
                   <p className="text-xs text-muted-foreground">
                     Sending your order to the kitchen
                   </p>
                 </>
               )}
             </div>
           ) : (
             <div className="space-y-3">
               {/* Prepay Option */}
               <Button
                 onClick={() => placeOrderWithPaymentMethod('prepay')}
                 className="w-full h-auto p-3 flex items-start space-x-3 hover:bg-accent hover:text-accent-foreground"
                 variant="outline"
               >
                 <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                   <CreditCard className="h-5 w-5 text-green-600" />
                 </div>
                 <div className="flex-1 text-left">
                   <h4 className="font-semibold text-sm mb-1">Pay Now (Online)</h4>
                   <p className="text-xs text-muted-foreground">
                     UPI, Card, Net Banking • Instant confirmation
                   </p>
                   <div className="flex items-center mt-1 text-xs text-green-600">
                     <CheckCircle2 className="h-3 w-3 mr-1" />
                     Recommended
                   </div>
                 </div>
               </Button>

               {/* Postpay Option */}
               <Button
                 onClick={() => placeOrderWithPaymentMethod('postpay')}
                 className="w-full h-auto p-3 flex items-start space-x-3 hover:bg-accent hover:text-accent-foreground"
                 variant="outline"
               >
                 <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                   <Wallet className="h-5 w-5 text-blue-600" />
                 </div>
                 <div className="flex-1 text-left">
                   <h4 className="font-semibold text-sm mb-1">Pay Later (Cash/Card)</h4>
                   <p className="text-xs text-muted-foreground">
                     Pay after meal • Cash, Card, UPI accepted
                   </p>
                   <div className="flex items-center mt-1 text-xs text-blue-600">
                     <CheckCircle2 className="h-3 w-3 mr-1" />
                     Flexible
                   </div>
                 </div>
               </Button>

               {/* Order Summary */}
               <div className="mt-3 p-3 bg-muted rounded-lg">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Order Total</span>
                   <span className="font-bold">₹{getTotalAmount() + Math.round(getTotalAmount() * 0.23)}</span>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">
                   Includes GST and Service Charge
                 </p>
               </div>

               {/* Cancel Button */}
               <Button
                 onClick={() => setShowPaymentChoice(false)}
                 variant="ghost"
                 className="w-full h-9 text-sm"
               >
                 Cancel
               </Button>
             </div>
           )}
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
};