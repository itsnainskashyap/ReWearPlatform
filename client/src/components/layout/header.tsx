import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { isAuthenticated } = useAuth();
  
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
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between p-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleDrawer}
          className="hover-elevate"
          data-testid="button-menu"
        >
          <Menu className="w-6 h-6" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg text-primary">ReWeara</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon"
          className="hover-elevate relative"
          data-testid="button-notifications"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
        </Button>
      </div>
    </header>
  );
}
