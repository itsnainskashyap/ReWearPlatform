import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Sparkles, Shield, Heart } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterLogin?: string;
}

export function LoginDialog({ open, onOpenChange, redirectAfterLogin }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Redirect to the login endpoint which will handle Replit OIDC
    const loginUrl = redirectAfterLogin 
      ? `/api/login?redirect=${encodeURIComponent(redirectAfterLogin)}`
      : '/api/login';
    window.location.href = loginUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glassmorphism border border-primary/20 rounded-3xl">
        <DialogHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto animate-pulse-glow">
            <span className="text-primary-foreground font-bold text-2xl">R</span>
          </div>
          
          <DialogTitle className="text-2xl font-bold gradient-text">
            Welcome to ReWeara
          </DialogTitle>
          
          <DialogDescription className="text-muted-foreground text-center">
            Join our sustainable fashion community to unlock exclusive features and personalized shopping experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm">Save items to your wishlist</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm">Get personalized recommendations</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm">Secure checkout and order tracking</span>
            </div>
          </div>

          {/* Login Button */}
          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-2xl button-glow"
            data-testid="button-login"
          >
            <User className="w-5 h-5 mr-2" />
            {isLoading ? 'Connecting...' : 'Continue with Replit'}
          </Button>

          {/* Continue as Guest */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground hover:text-foreground"
            data-testid="button-continue-guest"
          >
            Continue browsing as guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}