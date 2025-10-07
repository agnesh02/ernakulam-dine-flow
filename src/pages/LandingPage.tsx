import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, ChefHat, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-restaurant-grey-50">
      {/* Header */}
      <header className="restaurant-gradient-bg px-6 py-8 shadow-lg">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-12 w-12 text-restaurant-white mr-3" />
            <h1 className="text-4xl font-bold text-restaurant-white font-display">
              RestoGenie
            </h1>
          </div>
          <p className="text-restaurant-white/90 text-lg">
            A Modern Restaurant Management System
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-restaurant-grey-900 mb-4">
              Choose Your Interface
            </h2>
            <p className="text-restaurant-grey-700 text-lg">
              Select the appropriate interface based on your role
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Interface */}
            <Card className="restaurant-card hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="p-8 text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-restaurant-grey-900 mb-4">
                  Customer Interface
                </h3>
                <p className="text-restaurant-grey-700 mb-6 leading-relaxed">
                  Browse our digital menu, place orders, track your order status, and make payments. 
                  Perfect for customers dining in or taking away.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center text-sm text-restaurant-grey-600">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Digital Menu & Ordering
                  </div>
                  <div className="flex items-center justify-center text-sm text-restaurant-grey-600">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Real-time Order Tracking
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/customer')}
                  className="w-full restaurant-button-primary text-lg py-3"
                >
                  Enter Customer Interface
                </Button>
              </div>
            </Card>

            {/* Staff Interface */}
            <Card className="restaurant-card hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="p-8 text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <Settings className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-restaurant-grey-900 mb-4">
                  Staff Interface
                </h3>
                <p className="text-restaurant-grey-700 mb-6 leading-relaxed">
                  Manage menu items, track orders, handle table management, and oversee restaurant operations. 
                  Accessible to authorized staff members only.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center text-sm text-restaurant-grey-600">
                    <ChefHat className="h-4 w-4 mr-2" />
                    Menu & Order Management
                  </div>
                  <div className="flex items-center justify-center text-sm text-restaurant-grey-600">
                    <Settings className="h-4 w-4 mr-2" />
                    Table & Staff Controls
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/staff')}
                  className="w-full restaurant-button-accent text-lg py-3"
                >
                  Enter Staff Interface
                </Button>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-restaurant-grey-500 text-sm">
              Need help? Contact your restaurant staff for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
