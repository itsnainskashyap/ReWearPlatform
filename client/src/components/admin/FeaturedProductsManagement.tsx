import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Save,
  RotateCcw,
  Loader2,
  Star,
  Package,
  Timer
} from "lucide-react";

// Settings validation schema
const settingsSchema = z.object({
  maxItems: z.coerce.number().min(1).max(50).default(8),
  autoScrollMs: z.coerce.number().min(1000).max(30000).default(3000),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  brandName?: string;
  categoryName?: string;
}

interface FeaturedProductsPanelSettings {
  order: string[];
  maxItems: number;
  autoScrollMs: number;
}

interface FeaturedProductsResponse {
  settings: FeaturedProductsPanelSettings;
  products: Product[];
}

export default function FeaturedProductsManagement() {
  const { toast } = useToast();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);

  // Fetch featured products and settings
  const { data: featuredData, isLoading, refetch } = useQuery<FeaturedProductsResponse>({
    queryKey: ["/api/admin/featured-products"],
    queryFn: async () => {
      return apiRequest("/api/admin/featured-products");
    },
  });

  // Update local state when data changes
  useEffect(() => {
    if (featuredData?.products) {
      setOrderedProducts(featuredData.products);
    }
  }, [featuredData]);

  // Settings form
  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maxItems: featuredData?.settings.maxItems || 8,
      autoScrollMs: featuredData?.settings.autoScrollMs || 3000,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (featuredData?.settings) {
      settingsForm.reset({
        maxItems: featuredData.settings.maxItems,
        autoScrollMs: featuredData.settings.autoScrollMs,
      });
    }
  }, [featuredData?.settings, settingsForm]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { settings: FeaturedProductsPanelSettings }) => {
      return apiRequest("/api/admin/featured-products", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-products"] });
      setShowSettingsModal(false);
      toast({
        title: "Success",
        description: "Featured products settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update featured products settings",
        variant: "destructive",
      });
    },
  });

  // Move product up in order
  const moveProductUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedProducts];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setOrderedProducts(newOrder);
  };

  // Move product down in order
  const moveProductDown = (index: number) => {
    if (index === orderedProducts.length - 1) return;
    const newOrder = [...orderedProducts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrderedProducts(newOrder);
  };

  // Save current order
  const saveOrder = () => {
    if (!featuredData?.settings) return;
    
    const newSettings = {
      ...featuredData.settings,
      order: orderedProducts.map(p => p.id)
    };

    updateSettingsMutation.mutate({ settings: newSettings });
  };

  // Reset order to original
  const resetOrder = () => {
    if (featuredData?.products) {
      setOrderedProducts(featuredData.products);
    }
  };

  // Save settings from modal
  const onSaveSettings = (data: SettingsFormData) => {
    if (!featuredData?.settings) return;

    const newSettings = {
      ...featuredData.settings,
      maxItems: data.maxItems,
      autoScrollMs: data.autoScrollMs,
    };

    updateSettingsMutation.mutate({ settings: newSettings });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasOrderChanged = featuredData?.products && 
    JSON.stringify(orderedProducts.map(p => p.id)) !== 
    JSON.stringify(featuredData.products.map(p => p.id));

  return (
    <div className="space-y-6" data-testid="featured-products-management">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Featured Products Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage which products appear in the featured carousel and configure display settings
          </p>
        </div>
        <Button 
          onClick={() => setShowSettingsModal(true)}
          variant="outline"
          data-testid="button-open-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Current Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Max Items</p>
                <p className="text-2xl font-bold" data-testid="text-max-items">
                  {featuredData?.settings.maxItems || 8}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Auto-scroll Speed</p>
                <p className="text-2xl font-bold" data-testid="text-auto-scroll-speed">
                  {(featuredData?.settings.autoScrollMs || 3000) / 1000}s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Featured Products</p>
                <p className="text-2xl font-bold" data-testid="text-featured-count">
                  {orderedProducts.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Ordering */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Featured Products Order</CardTitle>
            <div className="flex gap-2">
              {hasOrderChanged && (
                <>
                  <Button 
                    onClick={resetOrder}
                    variant="outline"
                    size="sm"
                    data-testid="button-reset-order"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button 
                    onClick={saveOrder}
                    size="sm"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-order"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Order
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag products or use arrow buttons to reorder them. The order here determines how they appear in the carousel.
          </p>
        </CardHeader>
        <CardContent>
          {orderedProducts.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-featured-products">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Featured Products
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mark products as featured in the Products section to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`featured-product-${product.id}`}
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-green-600">
                        ₹{product.price}
                      </span>
                      {product.brandName && (
                        <Badge variant="secondary" className="text-xs">
                          {product.brandName}
                        </Badge>
                      )}
                      {product.categoryName && (
                        <Badge variant="outline" className="text-xs">
                          {product.categoryName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveProductUp(index)}
                      disabled={index === 0}
                      data-testid={`button-move-up-${product.id}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveProductDown(index)}
                      disabled={index === orderedProducts.length - 1}
                      data-testid={`button-move-down-${product.id}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Position Badge */}
                  <Badge className="min-w-[2rem] justify-center" data-testid={`position-${product.id}`}>
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent data-testid="modal-featured-settings">
          <DialogHeader>
            <DialogTitle>Featured Products Settings</DialogTitle>
            <DialogDescription>
              Configure how the featured products carousel behaves
            </DialogDescription>
          </DialogHeader>

          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-6">
              <FormField
                control={settingsForm.control}
                name="maxItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Items</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={50} 
                        {...field}
                        data-testid="input-max-items"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of products to show in the carousel (1-50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={settingsForm.control}
                name="autoScrollMs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-scroll Speed (milliseconds)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1000} 
                        max={30000} 
                        step={500}
                        {...field}
                        data-testid="input-auto-scroll-ms"
                      />
                    </FormControl>
                    <FormDescription>
                      How fast the carousel auto-scrolls (1000-30000ms)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowSettingsModal(false)}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}