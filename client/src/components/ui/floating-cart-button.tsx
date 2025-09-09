import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useLocation } from "wouter";

export default function FloatingCartButton() {
  const { itemCount } = useCartStore();
  const [, navigate] = useLocation();

  return (
    <Button
      onClick={() => navigate("/cart")}
      className="fixed left-4 bottom-28 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all z-40 w-14 h-14 border-2 border-white/20"
      data-testid="button-floating-cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
