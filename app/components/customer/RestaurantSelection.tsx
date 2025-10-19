import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { restaurantAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Star, Clock, ChefHat } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  image?: string;
  rating: number;
  preparationTime: number;
  isActive?: boolean;
  _count?: {
    menuItems: number;
    orders: number;
  };
}

interface RestaurantSelectionProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
}

export const RestaurantSelection = ({ onSelectRestaurant, selectedRestaurant }: RestaurantSelectionProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const data = await restaurantAPI.getAll(true); // Only active restaurants
      setRestaurants(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch restaurants";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Restaurant</h2>
          <p className="text-gray-600">Loading our food court restaurants...</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="restaurant-card">
              <div className="space-y-4">
                <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
                <div className="space-y-3">
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-24 animate-shimmer bg-[length:200%_100%]" />
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-24 animate-shimmer bg-[length:200%_100%]" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Restaurant</h2>
        <p className="text-gray-600">
          Explore cuisines from {restaurants.length} amazing restaurants in our food court
        </p>
      </div>

      {/* Restaurant Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {restaurants.map((restaurant) => {
          const isSelected = selectedRestaurant?.id === restaurant.id;
          return (
            <Card
              key={restaurant.id}
              onClick={() => onSelectRestaurant(restaurant)}
              className={`restaurant-card cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                isSelected ? 'ring-4 ring-primary ring-offset-2 bg-primary/5' : ''
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-primary text-white shadow-lg">
                    ✓ Selected
                  </Badge>
                </div>
              )}

              {/* Restaurant Image/Icon */}
              <div className="relative h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {restaurant.image ? (
                    <div className={`text-6xl transition-transform duration-300 ${
                      isSelected ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      {restaurant.image}
                    </div>
                  ) : (
                    <ChefHat className={`h-16 w-16 text-primary/50 transition-transform duration-300 ${
                      isSelected ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                  )}
                </div>
                
                {/* Cuisine Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 text-gray-700 hover:bg-white shadow-sm">
                    {restaurant.cuisine}
                  </Badge>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className={`text-xl font-bold transition-colors ${
                    isSelected ? 'text-primary' : 'text-gray-900 group-hover:text-primary'
                  }`}>
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {restaurant.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                  </div>

                  {/* Preparation Time */}
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.preparationTime} min</span>
                  </div>
                </div>

                {/* Menu Items Count */}
                {restaurant._count && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {restaurant._count.menuItems} items available
                  </div>
                )}

                {/* Hover Indicator / Selected Indicator */}
                <div className="pt-2">
                  {isSelected ? (
                    <div className="text-sm font-medium text-primary">
                      Currently viewing menu →
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view menu →
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {restaurants.length === 0 && (
        <Card className="restaurant-card text-center py-12">
          <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Restaurants Available</h3>
          <p className="text-muted-foreground">
            Please check back later for available restaurants
          </p>
        </Card>
      )}
    </div>
  );
};

