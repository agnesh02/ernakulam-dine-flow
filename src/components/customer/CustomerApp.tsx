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
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
          <TabsTrigger 
            value="menu" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden xs:inline">Menu</span>
            <span className="xs:hidden">Menu</span>
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation ${
              orderStatus !== "none" ? "relative" : ""
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="hidden xs:inline">Order Status</span>
            <span className="xs:hidden">Status</span>
            {orderStatus !== "none" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden xs:inline">Bill & Payment</span>
            <span className="xs:hidden">Payment</span>
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