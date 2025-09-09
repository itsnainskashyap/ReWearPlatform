import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Leaf, Recycle, Heart } from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <Card className={`w-full max-w-lg card-premium ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
          <CardContent className="pt-10 pb-10 text-center space-y-8">
            {/* Logo Section */}
            <div className={`space-y-4 ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-primary-foreground font-bold text-3xl">R</span>
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-3">Welcome to ReWeara</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Discover sustainable fashion through curated thrift finds and eco-friendly originals
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className={`space-y-6 ${isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 glassmorphism rounded-2xl hover-lift">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <Recycle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-primary mb-1">Thrift Store</div>
                  <div className="text-muted-foreground text-xs">Pre-loved fashion with character</div>
                </div>
                <div className="p-6 glassmorphism rounded-2xl hover-lift">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <Leaf className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="font-semibold text-accent-foreground mb-1">Originals</div>
                  <div className="text-muted-foreground text-xs">Sustainably crafted designs</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center space-x-8 py-4">
                <div className="text-center">
                  <div className="font-bold text-2xl text-primary">500+</div>
                  <div className="text-xs text-muted-foreground">Unique Items</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-primary">98%</div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-primary">2.5k</div>
                  <div className="text-xs text-muted-foreground">Happy Customers</div>
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                onClick={handleLogin}
                className="w-full h-14 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent text-lg font-semibold rounded-2xl button-glow hover-lift"
                data-testid="button-login"
              >
                <Heart className="w-5 h-5 mr-2" />
                Start Your Sustainable Journey
              </Button>

              <p className="text-sm text-muted-foreground flex items-center justify-center">
                <Leaf className="w-4 h-4 mr-1 text-primary" />
                Join our eco-conscious fashion community
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
