import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PinLogin } from "./PinLogin";
import { OrderManagement } from "./OrderManagement";
import { OrderHistory } from "./OrderHistory";
import { MenuControl } from "./MenuControl";
import { ClipboardList, Menu, History, LogOut, User } from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const StaffDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
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
    return authAPI.getStaffInfo();
  };

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          // Verify token is still valid
          try {
            await authAPI.verify();
            setIsAuthenticated(true);
            toast({
              title: "Welcome Back",
              description: "You are logged in",
              variant: "success",
            });
          } catch {
            // Token is invalid, clear storage
            authAPI.logout();
            console.log('Token verification failed, clearing auth data');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authAPI.logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [toast]);

  // Periodic token verification and session management
  useEffect(() => {
    if (!isAuthenticated) return;

    const verifyTokenPeriodically = async () => {
      try {
        await authAPI.verify();
      } catch {
        console.log('Token verification failed during session, logging out');
        authAPI.logout();
        setIsAuthenticated(false);
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
      }
    };

    // Verify token every 5 minutes
    const interval = setInterval(verifyTokenPeriodically, 5 * 60 * 1000);

    // Check token validity on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        verifyTokenPeriodically();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, toast]);

  // Session timeout warning (show warning 1 minute before token expires)
  useEffect(() => {
    if (!isAuthenticated) return;

    // JWT tokens expire in 8 hours, show warning 1 minute before
    const warningTime = 8 * 60 * 60 * 1000 - 60 * 1000; // 7 hours 59 minutes
    
    const timeoutWarning = setTimeout(() => {
      setSessionWarning(true);
      toast({
        title: "Session Expiring Soon",
        description: "Your session will expire in 1 minute. Please save your work.",
        variant: "warning",
      });
    }, warningTime);

    return () => clearTimeout(timeoutWarning);
  }, [isAuthenticated, toast]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-restaurant-grey-50 to-restaurant-grey-100 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const staffInfo = getStaffInfo();
  const restaurant = staffInfo?.restaurant;

  return (
    <div className="space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{staffInfo?.name || 'Staff Member'}</span>
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
        {restaurant && (
          <div className="mb-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <span className="text-2xl">{restaurant.image || '🍽️'}</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">{restaurant.name}</p>
              <p className="text-xs text-muted-foreground">{restaurant.cuisine}</p>
            </div>
          </div>
        )}
        <h2 className="text-2xl font-bold text-primary mb-2">Staff Dashboard</h2>
        <p className="text-muted-foreground">Restaurant command center for efficient operations</p>
      </div>

      {/* Session Warning Banner */}
      {sessionWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Session Expiring Soon</h3>
                <p className="text-sm text-yellow-700">Your session will expire in 1 minute. Please save your work and log in again if needed.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionWarning(false)}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

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