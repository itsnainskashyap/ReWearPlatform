import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/product-detail";
import Wishlist from "@/pages/wishlist";
import Profile from "@/pages/profile";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import FAQs from "@/pages/faqs";
import Policies from "@/pages/policies";
import Careers from "@/pages/careers";
import Admin from "@/pages/admin";
import Blog from "@/pages/blog";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import Drawer from "@/components/layout/drawer";
import FloatingCartButton from "@/components/ui/floating-cart-button";
import CartModal from "@/components/ui/cart-modal";
import AIChatAssistant from "@/components/ai/chat-assistant";
import { useState, useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isAuthenticated !== undefined) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  return (
    <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
      <Switch>
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/shop" component={Shop} />
            <Route path="/product/:id" component={ProductDetail} />
            <Route path="/wishlist" component={Wishlist} />
            <Route path="/profile" component={Profile} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/orders" component={Orders} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/faqs" component={FAQs} />
            <Route path="/policies" component={Policies} />
            <Route path="/careers" component={Careers} />
            <Route path="/admin" component={Admin} />
            <Route path="/blog" component={Blog} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setAppReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground font-sans">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center z-50">
          <div className="text-center space-y-4 animate-fadeInUp">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto animate-pulse-glow">
              <span className="text-primary-foreground font-bold text-2xl">R</span>
            </div>
            <div className="gradient-text font-bold text-xl">ReWeara</div>
            <div className="flex space-x-2 justify-center">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && appReady && (
        <>
          <div className="animate-fadeInUp">
            <Drawer />
            <Header />
            <main className={isAuthenticated ? "pb-24" : ""}>
              <Router />
            </main>
            {isAuthenticated && (
              <>
                <FloatingCartButton />
                <CartModal />
                <AIChatAssistant />
              </>
            )}
          </div>
          {/* Bottom Navigation - outside animated container for proper fixed positioning */}
          {isAuthenticated && <BottomNavigation />}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
