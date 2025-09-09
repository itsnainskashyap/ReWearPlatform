import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useQuery } from "@tanstack/react-query";

export default function CartModal() {
  const { isOpen, closeCart } = useCartStore();

  const { data: cart, isLoading } = useQuery<{ items: any[] } | null>({
    queryKey: ["/api/cart"],
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart}></div>
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" data-testid="text-cart-title">Shopping Cart</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={closeCart}
            className="hover-elevate"
            data-testid="button-close-cart"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading cart...</div>
          </div>
        ) : !cart || !cart?.items || cart.items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">Your cart is empty</div>
            <Button onClick={closeCart}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart?.items?.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-border">
                  <img 
                    src={item.product.images?.[0] || "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    data-testid={`img-cart-item-${item.id}`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold" data-testid={`text-product-name-${item.id}`}>
                      {item.product.name}
                    </h3>
                    {item.product.size && (
                      <p className="text-sm text-muted-foreground">Size: {item.product.size}</p>
                    )}
                    <p className="font-bold text-primary" data-testid={`text-product-price-${item.id}`}>
                      ₹{item.product.price}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-full"
                      data-testid={`button-decrease-quantity-${item.id}`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-full"
                      data-testid={`button-increase-quantity-${item.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary" data-testid="text-cart-total">
                  ₹{cart?.items?.reduce((total: number, item: any) => 
                    total + (parseFloat(item.product.price) * item.quantity), 0
                  ).toFixed(2) || "0.00"}
                </span>
              </div>
              <Button 
                className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
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
