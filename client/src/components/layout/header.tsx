import { useState, useEffect } from "react";
import { Bell, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@assets/ffffffffff_1757438501881.png";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      setIsVisible(true);
    }
  }, [isAuthenticated]);
  
  const toggleDrawer = () => {
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawer-content');
    
    if (drawer && drawerContent) {
      if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
        setTimeout(() => {
          drawerContent.classList.remove('-translate-x-full');
        }, 10);
      } else {
        drawerContent.classList.add('-translate-x-full');
        setTimeout(() => {
          drawer.classList.add('hidden');
        }, 300);
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-card shadow-lg border-b border-border transition-all duration-500 ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`}>
      <div className="flex items-center justify-between p-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleDrawer}
          className="hover-lift rounded-2xl"
          data-testid="button-menu"
        >
          <Menu className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
              <img src={logoImage} alt="ReWeara Logo" className="w-8 h-8 object-contain" />
            </div>
          </div>
          <span className="font-bold text-xl text-primary">ReWeara</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="hover-lift relative rounded-2xl"
          data-testid="button-notifications"
        >
          <Bell className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-destructive to-destructive/80 rounded-full animate-pulse">
            <span className="absolute inset-0 w-4 h-4 bg-destructive rounded-full animate-ping opacity-75"></span>
          </span>
        </Button>
      </div>
    </header>
  );
}
