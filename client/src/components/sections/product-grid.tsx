import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function ProductGrid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", { hotSelling: true, limit: 4 }],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart/items", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: "Item has been added to your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to add item to wishlist",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate(productId);
  };

  const handleAddToWishlist = (productId: string) => {
    addToWishlistMutation.mutate(productId);
  };

  return (
    <section className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" data-testid="text-hot-selling-title">Hot Selling</h2>
        <Button 
          variant="ghost"
          className="text-primary font-semibold hover-elevate"
          data-testid="button-view-all-hot-selling"
        >
          View All
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-card border border-border rounded-2xl overflow-hidden">
              <div className="aspect-square skeleton"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded-full w-3/4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 skeleton rounded-full w-1/3"></div>
                  <div className="h-4 skeleton rounded w-6"></div>
                </div>
                <div className="h-5 skeleton rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !products || !Array.isArray(products) || products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hot selling products available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="grid-hot-selling-products">
          {Array.isArray(products) && products.map((product: Product, index: number) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="minimal"
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
