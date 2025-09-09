import { Info, Shield, Briefcase, BookOpen, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Drawer() {
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

  const menuItems = [
    { icon: Info, label: "About", href: "#" },
    { icon: Shield, label: "Policies", href: "#" },
    { icon: Briefcase, label: "Careers", href: "#" },
    { icon: BookOpen, label: "Blog", href: "#" },
    { icon: Mail, label: "Contact", href: "#" },
  ];

  return (
    <div id="drawer" className="fixed inset-0 z-50 hidden">
      <div className="drawer-overlay absolute inset-0" onClick={closeDrawer}></div>
      <div 
        id="drawer-content"
        className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-card shadow-2xl transform -translate-x-full transition-transform duration-300 ease-out"
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
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 p-3 hover-elevate rounded-lg transition-colors"
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
