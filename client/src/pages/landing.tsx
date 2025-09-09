import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-2xl">R</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">Welcome to ReWeara</h1>
              <p className="text-muted-foreground">
                Discover sustainable fashion through thrift finds and eco-friendly originals
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="font-semibold text-primary mb-1">Thrift Store</div>
                <div className="text-muted-foreground text-xs">Pre-loved fashion finds</div>
              </div>
              <div className="p-4 bg-accent/5 rounded-lg">
                <div className="font-semibold text-accent-foreground mb-1">Originals</div>
                <div className="text-muted-foreground text-xs">Eco-friendly designs</div>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-login"
            >
              Get Started
            </Button>

            <p className="text-xs text-muted-foreground">
              Join our sustainable fashion community
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
