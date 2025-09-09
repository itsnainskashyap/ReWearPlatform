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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-card rounded-2xl shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-muted"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !products || !Array.isArray(products) || products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hot selling products available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="grid-hot-selling-products">
          {Array.isArray(products) && products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
}
