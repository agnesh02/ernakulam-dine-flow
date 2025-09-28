import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { CustomerApp } from "@/components/customer/CustomerApp";
import { Settings, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-restaurant-grey-50">
      {/* Header */}
      <header className="restaurant-gradient-bg px-6 py-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-restaurant-white font-display">
            RestaurantOS
          </h1>
          <p className="text-restaurant-white/80 text-sm mt-1">
            A Modern Restaurant Management System
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6">
        <Card className="restaurant-card">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
              <TabsTrigger 
                value="staff" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">Staff Interface</span>
                <span className="xs:hidden">Staff</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customer" 
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-3 px-2 text-xs sm:text-sm touch-manipulation"
              >
                <Users className="h-4 w-4" />
                <span className="hidden xs:inline">Customer Interface</span>
                <span className="xs:hidden">Customer</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="staff" className="space-y-6">
              <StaffDashboard />
            </TabsContent>
            
            <TabsContent value="customer" className="space-y-6">
              <CustomerApp />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;