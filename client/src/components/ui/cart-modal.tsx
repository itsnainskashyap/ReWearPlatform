import { X, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function CartModal() {
  const { isOpen, closeCart } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  const { data: cart, isLoading } = useQuery<{ items: any[] } | null>({
    queryKey: ["/api/cart"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 drawer-overlay"
        onClick={handleBackdropClick}
      />
      <div 
        className={`fixed bottom-[7rem] left-4 right-4 glassmorphism border border-white/20 rounded-3xl transition-all duration-500 max-h-[70vh] flex flex-col shadow-2xl ${
          isVisible ? 'animate-slide-up' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-accent to-accent/80 rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text" data-testid="text-cart-title">
                  Shopping Cart
                </h2>
                {cart?.items && cart.items.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={closeCart}
              className="hover-lift rounded-2xl h-12 w-12"
              data-testid="button-close-cart"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 pb-4">
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
                onClick={closeCart}
                className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-2xl px-8 py-3 font-semibold button-glow hover-lift"
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
                  >
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="relative overflow-hidden rounded-xl">
                        {item.product.images?.[0] ? (
                          <img 
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover group-hover:scale-110 transition-transform duration-300"
                            data-testid={`img-cart-item-${item.id}`}
                          />
                        ) : (
                          <div className="w-16 h-16 skeleton rounded-xl" />
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base mb-1 line-clamp-1" data-testid={`text-product-name-${item.id}`}>
                          {item.product.name}
                        </h3>
                        {item.product.size && (
                          <p className="text-sm text-muted-foreground mb-1">Size: {item.product.size}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg text-primary" data-testid={`text-product-price-${item.id}`}>
                            ₹{parseFloat(item.product.price).toFixed(2)}
                          </span>
                          {item.product.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price) && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{parseFloat(item.product.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-background/50 rounded-2xl p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl hover-lift"
                            data-testid={`button-decrease-quantity-${item.id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl hover-lift"
                            data-testid={`button-increase-quantity-${item.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-2xl text-destructive hover:bg-destructive/10 hover-lift"
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
              <div className="border-t border-white/10 pt-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    ₹{cart?.items?.reduce((total: number, item: any) => 
                      total + (parseFloat(item.product.price) * item.quantity), 0
                    ).toFixed(2) || "0.00"}
                  </span>
                </div>

                {/* Savings */}
                {cart?.items?.some((item: any) => item.product.originalPrice && parseFloat(item.product.originalPrice) > parseFloat(item.product.price)) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600">You Save</span>
                    <span className="font-semibold text-green-600">
                      -₹{cart?.items?.reduce((total: number, item: any) => {
                        const originalPrice = parseFloat(item.product.originalPrice || item.product.price);
                        const currentPrice = parseFloat(item.product.price);
                        return total + ((originalPrice - currentPrice) * item.quantity);
                      }, 0).toFixed(2) || "0.00"}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-white/10 pt-3 mt-4 bg-background/95 backdrop-blur-sm rounded-b-3xl p-4 -mx-4 -mb-4">
                  <div className="flex justify-between items-center text-lg font-bold mb-3">
                    <span>Total</span>
                    <span className="gradient-text text-2xl" data-testid="text-cart-total">
                      ₹{cart?.items?.reduce((total: number, item: any) => 
                        total + (parseFloat(item.product.price) * item.quantity), 0
                      ).toFixed(2) || "0.00"}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent text-base font-bold rounded-2xl button-glow hover-lift transition-all duration-300"
                    data-testid="button-checkout"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}