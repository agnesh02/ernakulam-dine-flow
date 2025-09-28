import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalMenu } from "./DigitalMenu";
import { OrderStatus } from "./OrderStatus";
import { BillPayment } from "./BillPayment";
import { Menu, Clock, CreditCard } from "lucide-react";

export const CustomerApp = () => {
  const [currentOrder, setCurrentOrder] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<"none" | "placed" | "preparing" | "ready" | "served">("none");
  const [activeTab, setActiveTab] = useState("menu");

  const updateOrderStatus = (status: "none" | "placed" | "preparing" | "ready" | "served") => {
    setOrderStatus(status);
    // Auto-switch to order status tab when order is placed
    if (status === "placed") {
      setActiveTab("status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Customer Experience</h2>
        <p className="text-muted-foreground">Mobile-first PWA for guests at the table</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger 
            value="menu" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <Menu className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className={`flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground ${
              orderStatus !== "none" ? "relative" : ""
            }`}
          >
            <Clock className="h-4 w-4" />
            Order Status
            {orderStatus !== "none" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <CreditCard className="h-4 w-4" />
            Bill & Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <DigitalMenu 
            currentOrder={currentOrder}
            setCurrentOrder={setCurrentOrder}
            setOrderStatus={updateOrderStatus}
          />
        </TabsContent>

        <TabsContent value="status">
          <OrderStatus 
            orderStatus={orderStatus}
            currentOrder={currentOrder}
          />
        </TabsContent>

        <TabsContent value="payment">
          <BillPayment 
            currentOrder={currentOrder}
            orderStatus={orderStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};