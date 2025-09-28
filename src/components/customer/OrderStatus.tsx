import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ChefHat, Utensils, AlertCircle } from "lucide-react";

interface OrderStatusProps {
  orderStatus: string;
  currentOrder: any[];
}

const statusSteps = [
  {
    id: "placed",
    label: "Order Placed",
    description: "Your order has been received",
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

export const OrderStatus = ({ orderStatus, currentOrder }: OrderStatusProps) => {
  const getStepStatus = (stepId: string) => {
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    const currentIndex = statusSteps.findIndex(step => step.id === orderStatus);
    
    if (currentIndex === -1) return "pending";
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getTotalAmount = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getEstimatedTime = () => {
    if (orderStatus === "placed") return "2-3 minutes";
    if (orderStatus === "preparing") return "15-20 minutes";
    if (orderStatus === "ready") return "Now serving";
    return "Completed";
  };

  if (orderStatus === "none") {
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Order</h3>
            <Badge 
              className={`${
                orderStatus === "placed" ? "bg-blue-500" :
                orderStatus === "preparing" ? "bg-restaurant-orange" :
                orderStatus === "ready" ? "bg-status-available" :
                "bg-restaurant-grey-500"
              } text-white`}
            >
              {statusSteps.find(step => step.id === orderStatus)?.label}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {currentOrder.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-primary">₹{getTotalAmount()}</span>
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
          <h3 className="text-lg font-semibold">Order Progress</h3>
          
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${status === "completed" ? "bg-status-available text-white" :
                      status === "current" ? "bg-restaurant-orange text-white animate-pulse" :
                      "bg-restaurant-grey-200 text-restaurant-grey-500"}
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Status Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-semibold ${
                        status === "current" ? "text-restaurant-orange" :
                        status === "completed" ? "text-status-available" :
                        "text-restaurant-grey-500"
                      }`}>
                        {step.label}
                      </h4>
                      {status === "current" && (
                        <Badge variant="secondary" className="bg-restaurant-orange text-white">
                          In Progress
                        </Badge>
                      )}
                      {status === "completed" && (
                        <Badge variant="secondary" className="bg-status-available text-white">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      status === "current" ? "text-foreground" :
                      status === "completed" ? "text-foreground" :
                      "text-muted-foreground"
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Timeline Connector */}
                  {index < statusSteps.length - 1 && (
                    <div className={`absolute left-[1.25rem] mt-10 w-0.5 h-6 ${
                      status === "completed" ? "bg-status-available" : "bg-restaurant-grey-200"
                    }`} style={{ marginLeft: '1.25rem' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Special Messages */}
      {orderStatus === "preparing" && (
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

      {orderStatus === "ready" && (
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