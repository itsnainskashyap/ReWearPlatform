import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

export default function Wishlist() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["/api/wishlist"],
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist",
      });
    },
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
  });

  const moveAllToCart = async () => {
    if (!wishlist || wishlist.length === 0) return;
    
    for (const item of wishlist) {
      await addToCartMutation.mutateAsync(item.product.id);
    }
    
    toast({
      title: "All items added to cart",
      description: `${wishlist.length} items have been added to your cart`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
        <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 skeleton rounded-full"></div>
            <div className="h-6 w-20 skeleton rounded-full"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="card-premium rounded-3xl overflow-hidden">
                <div className="w-full h-48 skeleton rounded-t-3xl"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 skeleton rounded-full w-3/4"></div>
                  <div className="h-6 skeleton rounded-full w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20 transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover-lift rounded-2xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">My Wishlist</h1>
              {wishlist && wishlist.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>
          {wishlist && wishlist.length > 0 && (
            <Button
              onClick={moveAllToCart}
              size="sm"
              className="rounded-xl bg-gradient-to-r from-accent to-accent/90 text-accent-foreground"
            >
              Add All to Cart
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!wishlist || wishlist.length === 0 ? (
          <div className="text-center py-16 animate-fadeInUp">
            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">Save items you love for later</p>
            <Button 
              onClick={() => navigate("/shop")}
              className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-2xl button-glow hover-lift"
              data-testid="button-start-shopping"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map((item: any, index: number) => (
              <Card
                key={item.id}
                className={`card-premium rounded-3xl overflow-hidden hover-lift group transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div 
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/product/${item.product.id}`)}
                >
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-48 skeleton"></div>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlistMutation.mutate(item.product.id);
                    }}
                    className="absolute top-3 right-3 h-10 w-10 rounded-full glassmorphism hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-1">{item.product.name}</h3>
                    {item.product.brandName && (
                      <p className="text-xs text-muted-foreground">{item.product.brandName}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-primary">₹{item.product.price}</span>
                      {item.product.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price) && (
                        <span className="text-xs text-muted-foreground line-through ml-1">
                          ₹{item.product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCartMutation.mutate(item.product.id);
                    }}
                    className="w-full h-10 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-xl button-glow"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}