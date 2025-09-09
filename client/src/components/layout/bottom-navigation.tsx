import { Home, Grid, Heart, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useState, useEffect } from "react";

export default function BottomNavigation() {
  const { itemCount } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const navItems = [
    { icon: Home, label: "Home", active: true, testId: "nav-home" },
    { icon: Grid, label: "Shop", active: false, testId: "nav-shop" },
    { icon: Heart, label: "Wishlist", active: false, testId: "nav-wishlist", hasNotification: true },
    { icon: ShoppingBag, label: "Cart", active: false, testId: "nav-cart", count: itemCount },
    { icon: User, label: "Profile", active: false, testId: "nav-profile" },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 glassmorphism border-t border-white/10 bottom-nav-shadow z-50 transition-all duration-500 ${isVisible ? 'animate-slide-up' : 'translate-y-full'}`}>
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item, index) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`flex flex-col items-center py-3 px-3 min-h-0 h-auto rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
              item.active 
                ? "text-primary bg-primary/10 shadow-lg" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={item.testId}
          >
            <div className="relative">
              <item.icon className={`w-6 h-6 mb-1 transition-all duration-200 ${item.active ? 'animate-pulse-glow' : ''}`} />
              {item.hasNotification && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-destructive to-destructive/80 rounded-full animate-pulse">
                  <span className="absolute inset-0 w-3 h-3 bg-destructive rounded-full animate-ping opacity-75"></span>
                </span>
              )}
              {item.count && item.count > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold px-1.5 animate-pulse-glow">
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </div>
            <span className={`text-xs transition-all duration-200 ${item.active ? "font-bold text-primary" : "font-medium"}`}>
              {item.label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
