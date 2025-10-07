import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PinLogin } from "./PinLogin";
import { TableManagement } from "./TableManagement";
import { OrderManagement } from "./OrderManagement";
import { OrderHistory } from "./OrderHistory";
import { MenuControl } from "./MenuControl";
import { LayoutGrid, ClipboardList, Menu, Settings, History, LogOut, User } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const StaffDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      variant: "success",
    });
  };

  const getStaffInfo = () => {
    try {
      const staffInfo = localStorage.getItem('staffInfo');
      return staffInfo ? JSON.parse(staffInfo) : null;
    } catch {
      return null;
    }
  };

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{getStaffInfo()?.name || 'Staff Member'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Staff Dashboard</h2>
        <p className="text-muted-foreground">Restaurant command center for efficient operations</p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto bg-restaurant-grey-100">
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
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 py-3 px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden xs:inline">Orders</span>
            <span className="xs:hidden">Orders</span>
          </TabsTrigger>
          <TabsTrigger 
            value="menu" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 py-3 px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden xs:inline">Menu</span>
            <span className="xs:hidden">Menu</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-restaurant-grey-600 hover:bg-restaurant-grey-200 py-3 px-3 text-xs sm:text-sm touch-manipulation transition-all duration-200"
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