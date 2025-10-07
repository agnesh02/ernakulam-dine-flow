import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, ChefHat, Coffee, Salad, Dessert, Clock, Plus, Trash2, Edit } from "lucide-react";
import { menuAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  prepTime: number;
  description: string;
  isVegetarian: boolean;
  tags?: string[];
  image?: string;
}

const availableTags = [
  { value: "bestseller", label: "Best Seller", color: "bg-orange-500" },
  { value: "spicy", label: "Spicy", color: "bg-red-500" },
  { value: "chefs-special", label: "Chef's Special", color: "bg-purple-500" },
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "healthy", label: "Healthy", color: "bg-green-600" },
  { value: "signature", label: "Signature Dish", color: "bg-amber-600" },
  { value: "value", label: "Value", color: "bg-teal-500" },
  { value: "premium", label: "Premium", color: "bg-yellow-600" },
];

const categoryIcons = {
  mains: ChefHat,
  beverages: Coffee,
  appetizers: Salad,
  desserts: Dessert,
};

export const MenuControl = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  // Form state for adding new menu item
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    prepTime: "",
    category: "",
    isVegetarian: true,
    tags: [] as string[]
  });

  // Function to clear form state
  const clearForm = () => {
    setNewItem({
      name: "",
      description: "",
      price: "",
      prepTime: "",
      category: "",
      isVegetarian: true,
      tags: []
    });
  };

  // Function to validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!newItem.name.trim()) {
      errors.push("Item name is required");
    } else if (newItem.name.trim().length < 2) {
      errors.push("Item name must be at least 2 characters long");
    }
    
    if (!newItem.description.trim()) {
      errors.push("Item description is required");
    } else if (newItem.description.trim().length < 10) {
      errors.push("Item description must be at least 10 characters long");
    }
    
    if (!newItem.price) {
      errors.push("Price is required");
    } else {
      const price = parseFloat(newItem.price);
      if (isNaN(price)) {
        errors.push("Price must be a valid number");
      } else if (price < 0) {
        errors.push("Price cannot be negative");
      } else if (price === 0) {
        errors.push("Price must be greater than ₹0");
      } else if (price < 1) {
        errors.push("Price must be at least ₹1");
      }
    }
    
    if (!newItem.prepTime) {
      errors.push("Preparation time is required");
    } else {
      const prepTime = parseInt(newItem.prepTime);
      if (isNaN(prepTime)) {
        errors.push("Preparation time must be a valid number");
      } else if (prepTime < 0) {
        errors.push("Preparation time cannot be negative");
      } else if (prepTime === 0) {
        errors.push("Preparation time must be greater than 0 minutes");
      } else if (prepTime < 1) {
        errors.push("Preparation time must be at least 1 minute");
      } else if (prepTime > 300) {
        errors.push("Preparation time cannot exceed 300 minutes");
      }
    }
    
    if (!newItem.category) {
      errors.push("Category is required");
    }
    
    return errors;
  };

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const items = await menuAPI.getAll();
      setMenuItems(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch menu items";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemAvailability = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const newAvailability = !item.isAvailable;
    
    // Optimistic update
    setMenuItems(items =>
      items.map(i =>
        i.id === itemId
          ? { ...i, isAvailable: newAvailability }
          : i
      )
    );

    try {
      await menuAPI.updateAvailability(itemId, newAvailability);
      toast({
        title: "Success",
        description: `${item.name} is now ${newAvailability ? 'available' : 'unavailable'}`,
        variant: "success",
      });
    } catch (error: unknown) {
      // Revert on error
      setMenuItems(items =>
        items.map(i =>
          i.id === itemId
            ? { ...i, isAvailable: !newAvailability }
            : i
        )
      );
      const message = error instanceof Error ? error.message : "Failed to update menu item";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const addMenuItem = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const menuItemData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        prepTime: parseInt(newItem.prepTime),
        category: newItem.category,
        isVegetarian: newItem.isVegetarian,
        tags: newItem.tags,
        isAvailable: true
      };

      const createdItem = await menuAPI.create(menuItemData);
      setMenuItems(prev => [createdItem, ...prev]);
      
      // Reset form
      clearForm();
      
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: `${createdItem.name} has been added to the menu`,
        variant: "success",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add menu item";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      prepTime: item.prepTime.toString(),
      category: item.category,
      isVegetarian: item.isVegetarian,
      tags: item.tags || []
    });
    setShowEditDialog(true);
  };

  const updateMenuItem = async () => {
    if (!editingItem) {
      toast({
        title: "Error",
        description: "No item selected for editing",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      const menuItemData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        prepTime: parseInt(newItem.prepTime),
        category: newItem.category,
        isVegetarian: newItem.isVegetarian,
        tags: newItem.tags,
      };

      const updatedItem = await menuAPI.update(editingItem.id, menuItemData);
      setMenuItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      
      // Reset form
      clearForm();
      
      setShowEditDialog(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: `${updatedItem.name} has been updated`,
        variant: "success",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update menu item";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const deleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      await menuAPI.delete(itemId);
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: `${itemName} has been deleted from the menu`,
        variant: "success",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete menu item";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesDietary = dietaryFilter === "all" || 
                          (dietaryFilter === "veg" && item.isVegetarian) ||
                          (dietaryFilter === "non-veg" && !item.isVegetarian);
    return matchesSearch && matchesCategory && matchesDietary;
  });

  const getAvailabilityStats = () => {
    const total = menuItems.length;
    const available = menuItems.filter(item => item.isAvailable).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  };

  const stats = getAvailabilityStats();
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Statistics Skeleton */}
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

        {/* Search and Filter Skeleton */}
        <Card className="restaurant-card">
          <div className="space-y-4">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md animate-shimmer bg-[length:200%_100%]" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md animate-shimmer bg-[length:200%_100%]" />
              ))}
            </div>
          </div>
        </Card>

        {/* Menu Items Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="restaurant-card">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-shimmer bg-[length:200%_100%]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full animate-shimmer bg-[length:200%_100%]" />
                      <div className="flex space-x-4">
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
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
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            </div>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (open) {
                clearForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="ml-4 restaurant-button-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to your restaurant menu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Chicken Biryani"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the dish..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prepTime">Prep Time (min) *</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        min="1"
                        max="300"
                        value={newItem.prepTime}
                        onChange={(e) => setNewItem(prev => ({ ...prev, prepTime: e.target.value }))}
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mains">Mains</SelectItem>
                        <SelectItem value="appetizers">Appetizers</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tags (Select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableTags.map((tag) => (
                        <div key={tag.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`tag-${tag.value}`}
                            checked={newItem.tags.includes(tag.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewItem(prev => ({ ...prev, tags: [...prev.tags, tag.value] }));
                              } else {
                                setNewItem(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag.value) }));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`tag-${tag.value}`} className="text-sm font-normal cursor-pointer">
                            {tag.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVegetarian"
                      checked={newItem.isVegetarian}
                      onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, isVegetarian: checked }))}
                    />
                    <Label htmlFor="isVegetarian">Vegetarian</Label>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addMenuItem}
                      disabled={isAdding}
                      className="flex-1 restaurant-button-accent"
                    >
                      {isAdding ? "Adding..." : "Add Item"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Menu Item Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                  <DialogDescription>
                    Update the details of this menu item
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Item Name *</Label>
                    <Input
                      id="edit-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Chicken Biryani"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea
                      id="edit-description"
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the dish..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-price">Price (₹) *</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="250"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-prepTime">Prep Time (min) *</Label>
                      <Input
                        id="edit-prepTime"
                        type="number"
                        min="1"
                        max="300"
                        value={newItem.prepTime}
                        onChange={(e) => setNewItem(prev => ({ ...prev, prepTime: e.target.value }))}
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mains">Mains</SelectItem>
                        <SelectItem value="appetizers">Appetizers</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tags (Select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availableTags.map((tag) => (
                        <div key={tag.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-tag-${tag.value}`}
                            checked={newItem.tags.includes(tag.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewItem(prev => ({ ...prev, tags: [...prev.tags, tag.value] }));
                              } else {
                                setNewItem(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag.value) }));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`edit-tag-${tag.value}`} className="text-sm font-normal cursor-pointer">
                            {tag.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isVegetarian"
                      checked={newItem.isVegetarian}
                      onCheckedChange={(checked) => setNewItem(prev => ({ ...prev, isVegetarian: checked }))}
                    />
                    <Label htmlFor="edit-isVegetarian">Vegetarian</Label>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEditDialog(false);
                        setEditingItem(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={updateMenuItem}
                      disabled={isEditing}
                      className="flex-1 restaurant-button-accent"
                    >
                      {isEditing ? "Updating..." : "Update Item"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-3">
            {/* Category Filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Categories</p>
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

            {/* Dietary Filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Dietary Preference</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={dietaryFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDietaryFilter("all")}
                  className={dietaryFilter === "all" ? "restaurant-button-accent" : ""}
                >
                  All
                </Button>
                <Button
                  variant={dietaryFilter === "veg" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDietaryFilter("veg")}
                  className={`flex items-center gap-2 ${dietaryFilter === "veg" ? "bg-green-500 hover:bg-green-600 text-white border-green-500" : ""}`}
                >
                  <div className="h-3 w-3 border-2 border-current rounded-sm flex items-center justify-center">
                    <div className="h-1.5 w-1.5 bg-current rounded-full"></div>
                  </div>
                  <span>Veg</span>
                </Button>
                <Button
                  variant={dietaryFilter === "non-veg" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDietaryFilter("non-veg")}
                  className={`flex items-center gap-2 ${dietaryFilter === "non-veg" ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}`}
                >
                  <div className="h-3 w-3 border-2 border-current rounded-sm flex items-center justify-center">
                    <div className="h-0 w-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-current"></div>
                  </div>
                  <span>Non-Veg</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Items - Staff Management View */}
      <div className="space-y-3">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-restaurant-grey-50 rounded-lg">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground w-[31%]">Item Details</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground w-[12%]">Category</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground w-[8%]">Price</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground w-[8%]">Time</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground w-[18%]">Tags</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground w-[8%]">Status</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
                  
                  return (
                    <tr key={item.id} className="border-b border-restaurant-grey-100 hover:bg-restaurant-grey-25 transition-colors">
                      {/* Item Details */}
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-restaurant-grey-100 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`h-3 w-3 border rounded-sm flex items-center justify-center flex-shrink-0 ${
                                item.isVegetarian ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                              }`}>
                                {item.isVegetarian ? (
                                  <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                                ) : (
                                  <div className="h-0 w-0 border-l-[1.5px] border-l-transparent border-r-[1.5px] border-r-transparent border-b-[2px] border-b-red-500"></div>
                                )}
                              </div>
                              <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="capitalize text-xs px-2">
                          {item.category}
                        </Badge>
                      </td>

                      {/* Price */}
                      <td className="p-3 text-center">
                        <span className="font-semibold text-sm text-primary">₹{item.price}</span>
                      </td>

                      {/* Prep Time */}
                      <td className="p-3 text-center">
                        <span className="text-xs font-medium text-muted-foreground">{item.prepTime}m</span>
                      </td>

                      {/* Tags */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.slice(0, 2).map((tag) => {
                              const tagConfig = availableTags.find(t => t.value === tag);
                              return tagConfig ? (
                                <Badge 
                                  key={tag} 
                                  className={`${tagConfig.color} text-white text-xs px-1.5 py-0.5`}
                                >
                                  {tagConfig.label}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                          {item.tags && item.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              +{item.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <Badge 
                          variant={item.isAvailable ? "default" : "secondary"}
                          className={`text-xs ${item.isAvailable ? "bg-status-available text-white" : "bg-restaurant-grey-300"}`}
                        >
                          {item.isAvailable ? "Live" : "Off"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex items-center justify-center space-x-1">
                     <Switch
                       checked={item.isAvailable}
                       onCheckedChange={() => toggleItemAvailability(item.id)}
                       className="data-[state=checked]:bg-status-available"
                     />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMenuItem(item.id, item.name)}
                            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
        {filteredItems.map((item) => {
          const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || ChefHat;
          
          return (
            <Card key={item.id} className="restaurant-card">
                <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2 bg-restaurant-grey-100 rounded-lg flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`h-3 w-3 border rounded-sm flex items-center justify-center flex-shrink-0 ${
                            item.isVegetarian ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                          }`}>
                            {item.isVegetarian ? (
                              <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                            ) : (
                              <div className="h-0 w-0 border-l-[1.5px] border-l-transparent border-r-[1.5px] border-r-transparent border-b-[2px] border-b-red-500"></div>
                            )}
                    </div>
                          <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-sm text-primary">₹{item.price}</span>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{item.prepTime} min</span>
                  </div>
                          <Badge variant="outline" className="capitalize text-xs">
                    {item.category}
                  </Badge>
                </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.tags.map((tag) => {
                              const tagConfig = availableTags.find(t => t.value === tag);
                              return tagConfig ? (
                                <Badge 
                                  key={tag} 
                                  className={`${tagConfig.color} text-white text-xs px-1.5 py-0.5`}
                                >
                                  {tagConfig.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                  {/* Mobile Actions */}
                <div className="flex items-center justify-between p-3 bg-restaurant-grey-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm">Available Today</span>
                    <Badge 
                      variant={item.isAvailable ? "default" : "secondary"}
                        className={`text-xs ${item.isAvailable ? "bg-status-available text-white" : "bg-restaurant-grey-300"}`}
                    >
                        {item.isAvailable ? "Live" : "Off"}
                    </Badge>
                  </div>
                    <div className="flex items-center space-x-2">
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => toggleItemAvailability(item.id)}
                        className="data-[state=checked]:bg-status-available"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMenuItem(item.id, item.name)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
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