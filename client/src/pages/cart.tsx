import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const { data: cart, isLoading } = useQuery<{ items: any[] } | null>({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        return await apiRequest("DELETE", `/api/cart/items/${itemId}`);
      }
      return await apiRequest("PUT", `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate(itemId);
  };

  const getTotalPrice = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total: number, item: any) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total: number, item: any) => total + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
              className="hover-lift rounded-2xl h-12 w-12"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-accent to-accent/80 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text" data-testid="text-cart-title">
                  Shopping Cart
                </h1>
                {cart?.items && cart.items.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 card-premium rounded-2xl">
                <div className="w-16 h-16 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 skeleton rounded-full w-3/4" />
                  <div className="h-4 skeleton rounded-full w-1/2" />
                  <div className="h-4 skeleton rounded-full w-1/3" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 skeleton rounded-full" />
                  <div className="w-8 h-4 skeleton rounded-full" />
                  <div className="w-8 h-8 skeleton rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart || !cart?.items || cart.items.length === 0 ? (
          <div className="text-center py-16 animate-fadeInUp">
            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some items to get started</p>
            <Button 
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-2xl px-8 py-3 font-semibold button-glow hover-lift"
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart?.items?.map((item: any, index: number) => (
                <div 
                  key={item.id} 
                  className={`card-premium p-4 rounded-2xl hover-lift group transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`cart-item-${item.id}`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="relative overflow-hidden rounded-xl">
                      {item.product.images?.[0] ? (
                        <img 
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover transition-transform duration-300 group-hover:scale-110"
                          data-testid={`cart-item-image-${item.id}`}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors" data-testid={`cart-item-name-${item.id}`}>
                        {item.product.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">Size: {item.size || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{item.product.condition}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-bold text-primary" data-testid={`cart-item-price-${item.id}`}>
                            ₹{item.product.price.toLocaleString()}
                          </span>
                          {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{item.product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-xl border-primary/20 hover:border-primary hover:bg-primary/10"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updateQuantityMutation.isPending}
                        data-testid={`button-decrease-quantity-${item.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <span className="min-w-[2rem] text-center font-semibold" data-testid={`cart-item-quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-xl border-primary/20 hover:border-primary hover:bg-primary/10"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updateQuantityMutation.isPending}
                        data-testid={`button-increase-quantity-${item.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removeItemMutation.isPending}
                        data-testid={`button-remove-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card-premium p-6 rounded-3xl border border-primary/10 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="font-semibold">Order Summary</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({getTotalItems()} items)</span>
                  <span className="font-medium" data-testid="text-subtotal">₹{getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t border-muted pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-total">
                      ₹{getTotalPrice().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-2xl py-3 font-semibold button-glow hover-lift"
                disabled={!cart?.items || cart.items.length === 0}
                data-testid="button-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}