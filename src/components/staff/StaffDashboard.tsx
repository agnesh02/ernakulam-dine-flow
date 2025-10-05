import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PinLogin } from "./PinLogin";
import { TableManagement } from "./TableManagement";
import { OrderManagement } from "./OrderManagement";
import { OrderHistory } from "./OrderHistory";
import { MenuControl } from "./MenuControl";
import { LayoutGrid, ClipboardList, Menu, Settings, History } from "lucide-react";

export const StaffDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Staff Dashboard</h2>
        <p className="text-muted-foreground">Restaurant command center for efficient operations</p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
          {/* TABLE MANAGEMENT TEMPORARILY DISABLED */}
          {/* <TabsTrigger 
            value="tables" 
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden xs:inline">Tables</span>
            <span className="xs:hidden">Tables</span>
          </TabsTrigger> */}
          <TabsTrigger 
            value="orders" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-3 text-xs sm:text-sm touch-manipulation"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden xs:inline">Orders</span>
            <span className="xs:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger 
            value="menu" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-3 text-xs sm:text-sm touch-manipulation"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden xs:inline">Menu</span>
            <span className="xs:hidden">Menu</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-3 text-xs sm:text-sm touch-manipulation"
          >
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">History</span>
            <span className="xs:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        {/* TABLE MANAGEMENT TEMPORARILY DISABLED */}
        {/* <TabsContent value="tables">
          <TableManagement />
        </TabsContent> */}

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="menu">
          <MenuControl />
        </TabsContent>

        <TabsContent value="history">
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};