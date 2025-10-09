import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { orderAPI } from "@/lib/api";
import { 
  CreditCard, 
  Smartphone, 
  Receipt, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  Percent,
  Store
} from "lucide-react";

interface BillPaymentProps {
  currentOrder: any;
  orderId: string | null;
  orderGroupId?: string | null; // For multi-restaurant orders
}

export const BillPayment = ({ currentOrder, orderId, orderGroupId }: BillPaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [groupOrders, setGroupOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const { toast } = useToast();

  // Fetch all orders in group for multi-restaurant orders
  useEffect(() => {
    const fetchGroupOrders = async () => {
      if (!orderGroupId) return;
      
      setIsLoadingOrders(true);
      try {
        const response = await orderAPI.getByGroupId(orderGroupId);
        setGroupOrders(response.orders || []);
      } catch (error) {
        console.error('Failed to fetch group orders:', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    
    fetchGroupOrders();
  }, [orderGroupId]);

  const processPayment = async (method: "upi" | "card") => {
    // Multi-restaurant order payment
    if (orderGroupId && groupOrders.length > 0) {
      const totalAmount = groupOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      
      setPaymentMethod(method);
      setPaymentStatus("processing");
      
      try {
        // Mark ALL orders in the group as paid
        await Promise.all(
          groupOrders.map(order => orderAPI.markPaid(order.id, method))
        );
        
        setPaymentStatus("completed");
        toast({
          title: "Payment Successful!",
          description: `Your payment of ₹${totalAmount} has been processed. Payment distributed to ${groupOrders.length} restaurants.`,
          duration: 5000,
        });
      } catch (error: any) {
        setPaymentStatus("failed");
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => {
          setPaymentStatus("pending");
          setPaymentMethod(null);
        }, 3000);
      }
      return;
    }

    // Single restaurant order payment
    if (!orderId) {
      toast({
        title: "Error",
        description: "No order ID found. Please place an order first.",
        variant: "destructive",
      });
      return;
    }

    setPaymentMethod(method);
    setPaymentStatus("processing");
    
    try {
      // Mark order as paid via API (includes 2-second delay for UX)
      await orderAPI.markPaid(orderId, method);
      
      setPaymentStatus("completed");
      toast({
        title: "Payment Successful!",
        description: `Your payment of ₹${currentOrder.grandTotal} has been processed.`,
      });
    } catch (error: any) {
      setPaymentStatus("failed");
      toast({
        title: "Payment Failed",
        description: error.message || "Payment could not be processed. Please try again.",
        variant: "destructive",
      });
      // Reset after showing error
      setTimeout(() => {
        setPaymentStatus("pending");
        setPaymentMethod(null);
      }, 3000);
    }
  };

  // Multi-restaurant orders - check if all are paid
  const allOrdersPaid = orderGroupId && groupOrders.length > 0 && groupOrders.every(o => o.paymentStatus === 'paid');
  const combinedTotal = groupOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const anyOrderNotServed = orderGroupId && groupOrders.length > 0 && groupOrders.some(o => o.status !== 'served');

  if (isLoadingOrders) {
    return (
      <Card className="restaurant-card text-center py-12">
        <div className="animate-spin h-16 w-16 border-4 border-restaurant-orange border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Bill...</h3>
      </Card>
    );
  }

  if (!currentOrder && (!orderGroupId || groupOrders.length === 0)) {
    return (
      <Card className="restaurant-card text-center py-12">
        <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Order Found</h3>
        <p className="text-muted-foreground">Place an order to view the bill here</p>
      </Card>
    );
  }

  if (paymentStatus === "completed" || (currentOrder && currentOrder.paymentStatus === "paid") || allOrdersPaid) {
    const totalPaid = orderGroupId && groupOrders.length > 0 ? combinedTotal : currentOrder?.grandTotal;
    const restaurantCount = groupOrders.length;
    
    return (
      <Card className="restaurant-card text-center py-12">
        <CheckCircle className="h-16 w-16 text-status-available mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-status-available">Payment Successful!</h3>
        <p className="text-muted-foreground mb-4">
          Thank you for dining with us. Your payment of ₹{totalPaid} has been processed.
          {restaurantCount > 1 && (
            <span className="block mt-2 text-sm">
              Payment distributed to {restaurantCount} restaurants.
            </span>
          )}
        </p>
        <Badge className="bg-status-available text-white">
          Transaction Complete
        </Badge>
      </Card>
    );
  }

  if (paymentStatus === "processing") {
    return (
      <Card className="restaurant-card text-center py-12">
        <div className="animate-spin h-16 w-16 border-4 border-restaurant-orange border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
        <p className="text-muted-foreground">
          Please wait while we process your {paymentMethod === "upi" ? "UPI" : "card"} payment
        </p>
      </Card>
    );
  }

  // Multi-restaurant bill view
  if (orderGroupId && groupOrders.length > 0) {
    return (
      <div className="space-y-6">
        {/* Combined Bill Summary */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Combined Bill Summary</h3>
              <Badge variant="outline" className="bg-restaurant-orange/10 text-restaurant-orange border-restaurant-orange">
                {groupOrders.length} Restaurants
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              You ordered from multiple restaurants. Payment will be distributed automatically.
            </p>

            <Separator />

            {/* Individual Restaurant Bills */}
            {groupOrders.map((order) => (
              <div key={order.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                {/* Restaurant Header */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-restaurant-grey-100 rounded-lg">
                    <Store className="h-5 w-5 text-restaurant-orange" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{order.restaurant?.name || 'Restaurant'}</h4>
                    <p className="text-xs text-muted-foreground">{order.restaurant?.cuisine}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₹{order.grandTotal}</p>
                    <p className="text-xs text-muted-foreground">Order #{order.orderNumber}</p>
                  </div>
                </div>

                {/* Items for this restaurant */}
                <div className="ml-12 space-y-2">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  
                  {/* Restaurant subtotal breakdown */}
                  <div className="pt-2 space-y-1 text-xs border-t">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST + Service</span>
                      <span>₹{order.gst + order.serviceCharge}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            {/* Combined Total */}
            <div className="bg-restaurant-grey-50 -mx-6 -mb-6 p-6 rounded-b-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Combined Subtotal</span>
                  <span>₹{groupOrders.reduce((sum, o) => sum + o.totalAmount, 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total GST (18%)</span>
                  <span>₹{groupOrders.reduce((sum, o) => sum + o.gst, 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Service Charge (5%)</span>
                  <span>₹{groupOrders.reduce((sum, o) => sum + o.serviceCharge, 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total to Pay</span>
                  <span className="text-primary">₹{combinedTotal}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Payment will be automatically distributed: 
                  {groupOrders.map((o, i) => (
                    <span key={o.id}>
                      {i > 0 && ', '}
                      <span className="font-medium"> ₹{o.grandTotal}</span> to {o.restaurant?.name}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Payment Method</h3>
            
            {anyOrderNotServed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Payment will be available once all your orders are served
                  </p>
                </div>
              </div>
            )}

          <div className="grid gap-4">
            {/* UPI Payment */}
            <Button
              variant="outline"
              className={`p-6 h-auto justify-start space-x-4 hover:bg-restaurant-grey-50 ${
                (orderGroupId ? anyOrderNotServed : currentOrder?.status !== "served") ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => processPayment("upi")}
              disabled={orderGroupId ? anyOrderNotServed : currentOrder?.status !== "served"}
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold">Pay with UPI</h4>
                <p className="text-sm text-muted-foreground">
                  Google Pay, PhonePe, Paytm, or any UPI app
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Instant
                </Badge>
              </div>
            </Button>

            {/* Card Payment */}
            <Button
              variant="outline"
              className={`p-6 h-auto justify-start space-x-4 hover:bg-restaurant-grey-50 ${
                (orderGroupId ? anyOrderNotServed : currentOrder?.status !== "served") ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => processPayment("card")}
              disabled={orderGroupId ? anyOrderNotServed : currentOrder?.status !== "served"}
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold">Pay with Card</h4>
                <p className="text-sm text-muted-foreground">
                  Credit or Debit Card (Visa, MasterCard, RuPay)
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Secure
                </Badge>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Security Info */}
      <Card className="restaurant-card bg-restaurant-grey-50">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Secure Payment</h4>
          <p className="text-xs text-muted-foreground">
            Your payment information is encrypted and secure. We do not store your card details.
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </Card>
    </div>
    );
  }

  // Single restaurant bill view (original)
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bill Summary</h3>
            <Badge variant="outline">
              Table Service
            </Badge>
          </div>

          {/* Itemized Bill */}
          <div className="space-y-3">
            {currentOrder.orderItems.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.menuItem.name}</span>
                    <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                </div>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Bill Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{currentOrder.totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Percent className="h-3 w-3" />
                <span>GST (18%)</span>
              </div>
              <span>₹{currentOrder.gst}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>Service Charge (5%)</span>
              </div>
              <span>₹{currentOrder.serviceCharge}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-primary">₹{currentOrder.grandTotal}</span>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose Payment Method</h3>
          
          {currentOrder.status !== "served" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Payment will be available once your order is served
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {/* UPI Payment */}
            <Button
              variant="outline"
              className={`p-6 h-auto justify-start space-x-4 hover:bg-restaurant-grey-50 ${
                currentOrder.status !== "served" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => processPayment("upi")}
              disabled={currentOrder.status !== "served"}
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold">Pay with UPI</h4>
                <p className="text-sm text-muted-foreground">
                  Google Pay, PhonePe, Paytm, or any UPI app
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Instant
                </Badge>
              </div>
            </Button>

            {/* Card Payment */}
            <Button
              variant="outline"
              className={`p-6 h-auto justify-start space-x-4 hover:bg-restaurant-grey-50 ${
                currentOrder.status !== "served" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => processPayment("card")}
              disabled={currentOrder.status !== "served"}
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold">Pay with Card</h4>
                <p className="text-sm text-muted-foreground">
                  Credit or Debit Card (Visa, MasterCard, RuPay)
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Secure
                </Badge>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Payment Security Info */}
      <Card className="restaurant-card bg-restaurant-grey-50">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Secure Payment</h4>
          <p className="text-xs text-muted-foreground">
            Your payment information is encrypted and secure. We do not store your card details.
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </Card>
    </div>
  );
};