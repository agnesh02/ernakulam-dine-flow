import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PinLogin } from "./PinLogin";
import { TableManagement } from "./TableManagement";
import { OrderManagement } from "./OrderManagement";
import { MenuControl } from "./MenuControl";
import { LayoutGrid, ClipboardList, Menu, Settings } from "lucide-react";

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

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger 
            value="tables" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <ClipboardList className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger 
            value="menu" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <Menu className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <TableManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="menu">
          <MenuControl />
        </TabsContent>

        <TabsContent value="settings">
          <div className="restaurant-card text-center py-12">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Settings Panel</h3>
            <p className="text-muted-foreground">Restaurant configuration and preferences</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};