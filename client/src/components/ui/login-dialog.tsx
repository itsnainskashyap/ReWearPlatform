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
        <DialogHeader className="text-center space-y-6">
          <div className="mx-auto">
            <img 
              src="/reweara-logo.png" 
              alt="ReWeara" 
              className="w-20 h-20 mx-auto"
            />
          </div>
          
          <DialogTitle className="text-2xl font-bold gradient-text">
            Welcome to ReWeara
          </DialogTitle>
          
          <DialogDescription className="text-muted-foreground text-center">
            Sustainable Fashion for a Better Tomorrow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-8">
          {/* Login Options */}
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
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full h-12 border-2 border-primary/20 hover:bg-primary/5 rounded-2xl"
            data-testid="button-continue-guest"
          >
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}