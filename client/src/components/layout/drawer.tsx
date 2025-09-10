import { Info, Shield, Briefcase, BookOpen, Mail, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Drawer() {
  const [, navigate] = useLocation();
  
  const closeDrawer = () => {
    const drawer = document.getElementById('drawer');
    const drawerContent = document.getElementById('drawer-content');
    
    if (drawer && drawerContent) {
      drawerContent.classList.add('-translate-x-full');
      setTimeout(() => {
        drawer.classList.add('hidden');
      }, 300);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  const menuItems = [
    { icon: Info, label: "About", path: "/about" },
    { icon: Mail, label: "Contact", path: "/contact" },
    { icon: HelpCircle, label: "FAQs", path: "/faqs" },
    { icon: Shield, label: "Policies", path: "/policies" },
    { icon: Briefcase, label: "Careers", path: "/careers" },
  ];

  return (
    <div id="drawer" className="fixed inset-0 z-50 hidden">
      <div className="drawer-overlay absolute inset-0 bg-black/50" onClick={closeDrawer}></div>
      <div 
        id="drawer-content"
        className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-card opacity-100 shadow-2xl transform -translate-x-full transition-transform duration-300 ease-out z-50"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-primary">ReWeara</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={closeDrawer}
              className="hover-elevate"
              data-testid="button-close-drawer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className="flex items-center space-x-3 p-4 hover-elevate rounded-lg transition-colors w-full text-left text-[#0B5A3A] dark:text-foreground"
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
