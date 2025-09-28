import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Clock,
  ChefHat,
  Coffee,
  Salad,
  Dessert,
  Star,
  X
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  prepTime: number;
  rating: number;
  isAvailable: boolean;
  image?: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface DigitalMenuProps {
  currentOrder: OrderItem[];
  setCurrentOrder: (order: OrderItem[]) => void;
  setOrderStatus: (status: "none" | "placed" | "preparing" | "ready" | "served") => void;
}

const categoryIcons = {
  mains: ChefHat,
  beverages: Coffee,
  appetizers: Salad,
  desserts: Dessert,
};

export const DigitalMenu = ({ currentOrder, setCurrentOrder, setOrderStatus }: DigitalMenuProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "Chicken Biryani",
      category: "mains",
      price: 299,
      description: "Aromatic basmati rice with tender chicken pieces, served with raita and pickle",
      prepTime: 25,
      rating: 4.8,
      isAvailable: true,
    },
    {
      id: "2",
      name: "Masala Dosa",
      category: "mains",
      price: 149,
      description: "Crispy crepe with spiced potato filling, served with sambar and chutneys",
      prepTime: 15,
      rating: 4.6,
      isAvailable: true,
    },
    {
      id: "3",
      name: "Fish Curry",
      category: "mains",
      price: 249,
      description: "Traditional Kerala fish curry with coconut milk and spices",
      prepTime: 20,
      rating: 4.7,
      isAvailable: false,
    },
    {
      id: "4",
      name: "Filter Coffee",
      category: "beverages",
      price: 45,
      description: "Traditional South Indian filter coffee, strong and aromatic",
      prepTime: 5,
      rating: 4.5,
      isAvailable: true,
    },
    {
      id: "5",
      name: "Mango Lassi",
      category: "beverages",
      price: 75,
      description: "Refreshing yogurt-based drink with fresh mango",
      prepTime: 3,
      rating: 4.4,
      isAvailable: true,
    },
    {
      id: "6",
      name: "Samosa",
      category: "appetizers",
      price: 89,
      description: "Crispy fried pastry with savory potato and pea filling",
      prepTime: 10,
      rating: 4.3,
      isAvailable: true,
    },
    {
      id: "7",
      name: "Gulab Jamun",
      category: "desserts",
      price: 79,
      description: "Sweet milk dumplings in warm sugar syrup",
      prepTime: 8,
      rating: 4.6,
      isAvailable: false,
    },
    {
      id: "8",
      name: "Tandoori Chicken",
      category: "mains",
      price: 349,
      description: "Marinated chicken grilled in tandoor, served with mint chutney",
      prepTime: 30,
      rating: 4.9,
      isAvailable: true,
    },
  ];

  const addToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setCurrentOrder(
        currentOrder.map(orderItem =>
          orderItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
    } else {
      setCurrentOrder([...currentOrder, { ...item, quantity: 1 }]);
    }
  };

  const removeFromOrder = (itemId: string) => {
    const existingItem = currentOrder.find(orderItem => orderItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCurrentOrder(
        currentOrder.map(orderItem =>
          orderItem.id === itemId
            ? { ...orderItem, quantity: orderItem.quantity - 1 }
            : orderItem
        )
      );
    } else {
      setCurrentOrder(currentOrder.filter(orderItem => orderItem.id !== itemId));
    }
  };

  const getItemQuantity = (itemId: string) => {
    const item = currentOrder.find(orderItem => orderItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return currentOrder.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = () => {
    if (currentOrder.length > 0) {
      setOrderStatus("placed");
      
      // Show success toast
      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Your order for ${getTotalItems()} items (₹${getTotalAmount()}) has been sent to the kitchen.`,
        duration: 4000,
      });
      
      // Show success message and automatically navigate to order status
      // Simulate order progression
      setTimeout(() => setOrderStatus("preparing"), 3000);
      setTimeout(() => setOrderStatus("ready"), 20000);
      // Scroll to top to see the tabs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const isAvailable = item.isAvailable;
    return matchesSearch && matchesCategory && isAvailable;
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for delicious food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "restaurant-button-accent" : ""}
            >
              All
            </Button>
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || ChefHat;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 ${selectedCategory === category ? "restaurant-button-accent" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <div className="grid gap-4">
        {filteredItems.map((item) => {
          const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
          const quantity = getItemQuantity(item.id);
          
          return (
            <Card key={item.id} className="restaurant-card">
              <div className="space-y-4">
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-restaurant-grey-100 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{item.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-lg text-primary">₹{item.price}</span>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{item.prepTime} min</span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Controls */}
                <div className="flex items-center justify-between">
                  {quantity === 0 ? (
                    <Button
                      onClick={() => addToOrder(item)}
                      className="restaurant-button-accent flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Order
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-3 flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromOrder(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-lg">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToOrder(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="ml-auto font-bold text-primary">
                        ₹{item.price * quantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Floating Order Summary */}
      {currentOrder.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="restaurant-card bg-primary text-primary-foreground border-primary shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-restaurant-white/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{getTotalItems()} items in cart</p>
                  <p className="text-sm opacity-90">Total: ₹{getTotalAmount()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Dialog open={showCart} onOpenChange={setShowCart}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/20 bg-white/10 px-4 py-2 h-10 font-medium transition-all duration-300 hover:opacity-90"
                    >
                      View Cart
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Your Order
                      </DialogTitle>
                      <DialogDescription>
                        Review and modify your order before placing it
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {currentOrder.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Your cart is empty</p>
                        </div>
                      ) : (
                        <>
                          {/* Cart Items */}
                          <div className="space-y-3">
                            {currentOrder.map((item) => {
                              const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
                              return (
                                <Card key={item.id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="p-2 bg-restaurant-grey-100 rounded-lg">
                                        <Icon className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFromOrder(item.id)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addToOrder(item)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFromOrder(item.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <span className="text-xs text-muted-foreground">
                                      {item.quantity} × ₹{item.price}
                                    </span>
                                    <span className="font-bold text-sm">
                                      ₹{item.price * item.quantity}
                                    </span>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Order Summary */}
                          <Card className="p-4 bg-muted">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Items ({getTotalItems()})</span>
                                <span>₹{getTotalAmount()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Service Charge (5%)</span>
                                <span>₹{Math.round(getTotalAmount() * 0.05)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>GST (18%)</span>
                                <span>₹{Math.round(getTotalAmount() * 0.18)}</span>
                              </div>
                              <div className="border-t pt-2">
                                <div className="flex justify-between font-bold text-lg">
                                  <span>Total</span>
                                  <span>₹{getTotalAmount() + Math.round(getTotalAmount() * 0.23)}</span>
                                </div>
                              </div>
                            </div>
                          </Card>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowCart(false)}
                              className="flex-1"
                            >
                              Continue Shopping
                            </Button>
                            <Button
                              onClick={() => {
                                setShowCart(false);
                                placeOrder();
                              }}
                              className="flex-1 restaurant-gradient-accent text-white hover:opacity-90"
                            >
                              Place Order
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={placeOrder}
                  className="restaurant-gradient-accent text-white hover:opacity-90 shadow-orange px-4 py-2 h-10 font-medium transition-all duration-300"
                >
                  Place Order →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {filteredItems.length === 0 && (
        <Card className="restaurant-card text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">Try searching for something else or check other categories</p>
        </Card>
      )}
    </div>
  );
};