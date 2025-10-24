import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, History, RefreshCw } from "lucide-react";
import { orderAPI, authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType?: string;
  totalAmount: number;
  serviceCharge: number;
  gst: number;
  grandTotal: number;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    notes?: string;
    menuItem: {
      id: string;
      name: string;
      category: string;
      prepTime: number;
    };
  }>;
  restaurant?: {
    id: string;
    name: string;
    cuisine: string;
    image?: string;
  };
}

export const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'served' | 'cancelled'>('all');
  const { toast } = useToast();

  // Get restaurant ID from staff info
  const staffInfo = authAPI.getStaffInfo();
  const restaurantId = staffInfo?.restaurantId;

  const fetchOrderHistory = useCallback(async () => {
    if (!restaurantId) {
      toast({
        title: "Error",
        description: "Unable to determine your restaurant. Please log in again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching order history for restaurant:', restaurantId);
      // Fetch only orders for this restaurant
      const fetchedOrders = await orderAPI.getAll(undefined, restaurantId);
      console.log('Fetched orders:', fetchedOrders);
      setOrders(fetchedOrders || []);
    } catch (error: any) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch order history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, restaurantId]);

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
    
    console.log('Today orders:', todayOrders.length, 'out of', orders.length, 'total orders');
    return todayOrders;
  };

  const getFilteredOrders = () => {
    const todayOrders = getTodayOrders();
    
    let filtered;
    if (filterStatus === 'all') {
      filtered = todayOrders.filter(order => 
        order.status === 'served' || order.status === 'cancelled'
      );
    } else {
      filtered = todayOrders.filter(order => order.status === filterStatus);
    }
    
    console.log('Filtered orders:', filtered.length, 'for status:', filterStatus);
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const getTodayStats = () => {
    const todayOrders = getTodayOrders();
    const served = todayOrders.filter(o => o.status === 'served').length;
    const cancelled = todayOrders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = todayOrders
      .filter(o => o.status === 'served' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.grandTotal, 0);
    
    return { served, cancelled, totalRevenue };
  };

  const stats = getTodayStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="restaurant-card">
              <div className="text-center space-y-2">
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 mx-auto animate-shimmer bg-[length:200%_100%]" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-20 mx-auto animate-shimmer bg-[length:200%_100%]" />
              </div>
            </Card>
          ))}
        </div>

        {/* Orders List Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="restaurant-card">
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order History</h2>
        <Button
          onClick={fetchOrderHistory}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.served}</p>
            <p className="text-sm text-muted-foreground">Served</p>
          </div>
        </Card>
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </div>
        </Card>
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">₹{stats.totalRevenue}</p>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </div>
        </Card>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="restaurant-card bg-gray-50">
          <div className="text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Total orders fetched: {orders.length}</p>
            <p>Today&apos;s orders: {getTodayOrders().length}</p>
            <p>Filtered orders: {filteredOrders.length}</p>
            <p>Current filter: {filterStatus}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          </div>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
          className={filterStatus === 'all' ? 'restaurant-button-accent' : ''}
        >
          All
        </Button>
        <Button
          variant={filterStatus === 'served' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('served')}
          className={filterStatus === 'served' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Served
        </Button>
        <Button
          variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('cancelled')}
          className={filterStatus === 'cancelled' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancelled
        </Button>
      </div>

      {/* Order History */}
      {filteredOrders.length === 0 ? (
        <Card className="restaurant-card text-center py-12">
          <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus === 'all' 
              ? 'No completed orders yet today' 
              : `No ${filterStatus} orders today`}
          </p>
          <Button 
            onClick={fetchOrderHistory} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="restaurant-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <Badge 
                    variant={order.status === 'served' ? 'default' : 'destructive'}
                    className={order.status === 'served' ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {order.status === 'served' ? 'Served' : 'Cancelled'}
                  </Badge>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 capitalize">{order.orderType || 'dine-in'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {order.paymentMethod || 'cash'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items:</span>
                    <span className="ml-2">{order.orderItems.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 font-semibold">₹{order.grandTotal}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Items:</p>
                  <div className="space-y-1">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="text-sm flex justify-between">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

