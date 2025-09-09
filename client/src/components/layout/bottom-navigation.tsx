import { Home, Grid, Heart, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export default function BottomNavigation() {
  const { itemCount } = useCartStore();

  const navItems = [
    { icon: Home, label: "Home", active: true, testId: "nav-home" },
    { icon: Grid, label: "Shop", active: false, testId: "nav-shop" },
    { icon: Heart, label: "Wishlist", active: false, testId: "nav-wishlist", hasNotification: true },
    { icon: ShoppingBag, label: "Cart", active: false, testId: "nav-cart", count: itemCount },
    { icon: User, label: "Profile", active: false, testId: "nav-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card bottom-nav-shadow z-40">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`flex flex-col items-center py-2 px-4 min-h-0 h-auto ${
              item.active 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            } transition-colors`}
            data-testid={item.testId}
          >
            <div className="relative">
              <item.icon className="w-6 h-6 mb-1" />
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
              )}
              {item.count && item.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {item.count}
                </span>
              )}
            </div>
            <span className={`text-xs ${item.active ? "font-semibold" : ""}`}>
              {item.label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
