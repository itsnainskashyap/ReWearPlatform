import { Home, Grid, Heart, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";

export default function BottomNavigation() {
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [isVisible, setIsVisible] = useState(false);
  const [location, navigate] = useLocation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const navItems = [
    { icon: Home, label: "Home", path: "/", testId: "nav-home", protected: false },
    { icon: Grid, label: "Shop", path: "/shop", testId: "nav-shop", protected: false },
    { icon: Heart, label: "Wishlist", path: "/wishlist", testId: "nav-wishlist", hasNotification: true, protected: true },
    { icon: ShoppingBag, label: "Cart", path: "/cart", testId: "nav-cart", count: itemCount, protected: false },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile", protected: true },
  ];

  const handleNavClick = (item: any) => {
    if (item.protected && !isAuthenticated) {
      openLogin(item.path); // Pass the intended path for redirect after login
    } else if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <nav className={`bottom-nav-fixed glassmorphism border-t border-white/10 bottom-nav-shadow transition-all duration-500 ${isVisible ? 'motion-safe-slide-up' : 'translate-y-full'}`} role="navigation" aria-label="Main navigation">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item, index) => {
          const isActive = item.path ? location === item.path : (item.path === "/cart" && location === "/cart");
          return (
            <Button
              key={item.label}
              variant="ghost"
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center py-3 px-3 min-h-0 h-auto rounded-2xl transition-all duration-300 motion-safe-hover-scale active:scale-95 focus-outline ${
                isActive 
                  ? "bg-primary/10 shadow-lg" 
                  : "text-muted-foreground hover:bg-primary/5"
              }`}
              style={{
                ...(isActive ? { color: 'var(--brand-green)' } : {}),
                animationDelay: `${index * 50}ms`
              }}
              data-testid={item.testId}
              aria-label={`${item.label}${item.count ? ` (${item.count} items)` : ''}${isActive ? ' - current page' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 mb-1 transition-all duration-200 ${isActive ? 'animate-pulse-glow' : ''}`} />
                {item.hasNotification && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-destructive to-destructive/80 rounded-full animate-pulse">
                    <span className="absolute inset-0 w-3 h-3 bg-destructive rounded-full animate-ping opacity-75"></span>
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold px-1.5 animate-pulse-glow">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span 
                className={`text-xs transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}
                style={isActive ? { color: 'var(--brand-green)' } : {}}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
