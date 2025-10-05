import { useState } from "react";
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
  Percent
} from "lucide-react";

interface BillPaymentProps {
  currentOrder: any;
  orderId: string | null;
}

export const BillPayment = ({ currentOrder, orderId }: BillPaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const { toast } = useToast();

  const processPayment = async (method: "upi" | "card") => {
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

  if (!currentOrder) {
    return (
      <Card className="restaurant-card text-center py-12">
        <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Order Found</h3>
        <p className="text-muted-foreground">Place an order to view the bill here</p>
      </Card>
    );
  }

  if (paymentStatus === "completed" || currentOrder.paymentStatus === "paid") {
    return (
      <Card className="restaurant-card text-center py-12">
        <CheckCircle className="h-16 w-16 text-status-available mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-status-available">Payment Successful!</h3>
        <p className="text-muted-foreground mb-4">
          Thank you for dining with us. Your payment of ₹{currentOrder.grandTotal} has been processed.
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