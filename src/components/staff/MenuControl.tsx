import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChefHat, Coffee, Salad, Dessert, Clock } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  prepTime: number;
  description: string;
}

const categoryIcons = {
  mains: ChefHat,
  beverages: Coffee,
  appetizers: Salad,
  desserts: Dessert,
};

export const MenuControl = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "1",
      name: "Chicken Biryani",
      category: "mains",
      price: 299,
      isAvailable: true,
      prepTime: 25,
      description: "Aromatic basmati rice with tender chicken pieces",
    },
    {
      id: "2", 
      name: "Masala Dosa",
      category: "mains",
      price: 149,
      isAvailable: true,
      prepTime: 15,
      description: "Crispy crepe with spiced potato filling",
    },
    {
      id: "3",
      name: "Fish Curry",
      category: "mains", 
      price: 249,
      isAvailable: false,
      prepTime: 20,
      description: "Traditional Kerala fish curry with coconut",
    },
    {
      id: "4",
      name: "Filter Coffee",
      category: "beverages",
      price: 45,
      isAvailable: true,
      prepTime: 5,
      description: "Traditional South Indian filter coffee",
    },
    {
      id: "5",
      name: "Lassi",
      category: "beverages",
      price: 65,
      isAvailable: true,
      prepTime: 3,
      description: "Refreshing yogurt-based drink",
    },
    {
      id: "6",
      name: "Samosa",
      category: "appetizers",
      price: 89,
      isAvailable: true,
      prepTime: 10,
      description: "Crispy fried pastry with savory filling",
    },
    {
      id: "7",
      name: "Gulab Jamun", 
      category: "desserts",
      price: 79,
      isAvailable: false,
      prepTime: 8,
      description: "Sweet milk dumplings in sugar syrup",
    },
    {
      id: "8",
      name: "Tandoori Chicken",
      category: "mains",
      price: 349,
      isAvailable: true,
      prepTime: 30,
      description: "Marinated chicken grilled in tandoor",
    },
  ]);

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, isAvailable: !item.isAvailable }
          : item
      )
    );
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getAvailabilityStats = () => {
    const total = menuItems.length;
    const available = menuItems.filter(item => item.isAvailable).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  };

  const stats = getAvailabilityStats();
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
        </Card>
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-status-available">{stats.available}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </div>
        </Card>
        <Card className="restaurant-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{stats.unavailable}</p>
            <p className="text-sm text-muted-foreground">Unavailable</p>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="restaurant-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
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
              All Categories
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
      <div className="grid gap-4 md:grid-cols-2">
        {filteredItems.map((item) => {
          const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
          
          return (
            <Card key={item.id} className="restaurant-card">
              <div className="space-y-4">
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-restaurant-grey-100 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {item.category}
                  </Badge>
                </div>

                {/* Item Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-primary">₹{item.price}</span>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{item.prepTime} min</span>
                    </div>
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-3 bg-restaurant-grey-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Available Today</span>
                    <Badge 
                      variant={item.isAvailable ? "default" : "secondary"}
                      className={item.isAvailable ? "bg-status-available text-white" : "bg-restaurant-grey-300"}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => toggleItemAvailability(item.id)}
                    className="data-[state=checked]:bg-restaurant-orange"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card className="restaurant-card text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </Card>
      )}
    </div>
  );
};