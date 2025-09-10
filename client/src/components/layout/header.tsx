import { useState, useEffect } from "react";
import { Bell, Menu, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
export default function Header() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
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
          <img 
            src="/reweara-logo.png" 
            alt="ReWeara" 
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold gradient-text">ReWeara</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Sustainable Fashion</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {isAuthenticated ? (
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
          ) : (
            <Button 
              onClick={() => openLogin()}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-2xl h-10 px-4"
              data-testid="button-header-login"
            >
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
