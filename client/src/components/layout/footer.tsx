import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/916200613195', '_blank');
  };

  return (
    <footer className="bg-card border-t border-border p-6 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/reweara-logo.png" 
                alt="ReWeara" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold gradient-text">ReWeara</h1>
                <p className="text-sm text-muted-foreground">Sustainable Fashion</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Sustainable fashion for a better tomorrow. Join our eco-friendly community and make a positive impact on the planet.
            </p>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="font-semibold mb-4">Help & Support</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>6200613195</span>
              </div>
              <Button
                onClick={handleWhatsAppClick}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                data-testid="button-whatsapp-help"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Support
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground hover:text-foreground cursor-pointer">Shop</div>
              <div className="text-muted-foreground hover:text-foreground cursor-pointer">About</div>
              <div className="text-muted-foreground hover:text-foreground cursor-pointer">Contact</div>
              <div className="text-muted-foreground hover:text-foreground cursor-pointer">FAQs</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ReWeara. All rights reserved. • Sustainable Fashion for Everyone</p>
        </div>
      </div>
    </footer>
  );
}